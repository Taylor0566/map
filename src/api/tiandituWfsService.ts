import { TIANDITU_API_KEY } from '../config/api-keys';

/**
 * 天地图WFS服务接口
 * 用于获取道路网络等交通要素数据
 */

// WFS服务基础URL
const WFS_SERVICE_URL = 'http://gisserver.tianditu.gov.cn/TDTService/wfs';

// 图层类型
export enum LayerType {
  RAILWAY = 'LRRL', // 铁路图层
  ROAD = 'LRDL'     // 公路图层
}

/**
 * 获取交通要素GeoJSON数据
 * 
 * @param layerType 图层类型 (LRRL-铁路, LRDL-公路)
 * @param bbox 边界框 [minX, minY, maxX, maxY]
 * @returns GeoJSON格式的交通要素数据
 */
export const getTransportFeatures = async (
  layerType: LayerType,
  bbox: [number, number, number, number]
): Promise<any> => {
  try {
    // 构建WFS请求URL
    const params = new URLSearchParams({
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typename: layerType,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      bbox: bbox.join(',') + ',EPSG:4326',
      tk: TIANDITU_API_KEY
    });

    // 注意：实际使用时需要设置代理来避免跨域问题
    // 这里假设已经在next.config.js中配置了代理
    const proxyUrl = `/api/tianditu-wfs?${params.toString()}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`获取交通要素数据失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取交通要素数据出错:', error);
    throw error;
  }
};

/**
 * 在两点之间获取道路网络
 * 
 * @param startPoint 起点坐标 [lng, lat]
 * @param endPoint 终点坐标 [lng, lat]
 * @returns 道路网络GeoJSON
 */
export const getRoadNetwork = async (
  startPoint: [number, number],
  endPoint: [number, number]
): Promise<any> => {
  // 计算包含两点的bbox，并略微扩大范围
  const minLng = Math.min(startPoint[0], endPoint[0]) - 0.05;
  const minLat = Math.min(startPoint[1], endPoint[1]) - 0.05;
  const maxLng = Math.max(startPoint[0], endPoint[0]) + 0.05;
  const maxLat = Math.max(startPoint[1], endPoint[1]) + 0.05;
  
  const bbox: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];
  
  try {
    // 获取公路数据
    const roadData = await getTransportFeatures(LayerType.ROAD, bbox);
    return roadData;
  } catch (error) {
    console.error('获取道路网络失败:', error);
    throw error;
  }
};

// 节点类型定义
interface Node {
  id: string;
  coordinates: [number, number];
  edges: Edge[];
}

// 边类型定义
interface Edge {
  to: string; // 目标节点ID
  weight: number; // 权重（距离）
  coordinates: [number, number][]; // 边的坐标序列
}

// 图结构
class Graph {
  nodes: Map<string, Node> = new Map();
  
  // 添加节点
  addNode(id: string, coordinates: [number, number]): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, coordinates, edges: [] });
    }
  }
  
  // 添加边
  addEdge(from: string, to: string, weight: number, coordinates: [number, number][]): void {
    const fromNode = this.nodes.get(from);
    if (fromNode) {
      fromNode.edges.push({ to, weight, coordinates });
    }
  }
  
  // 获取节点
  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }
  
  // 获取所有节点
  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }
}

// 计算两点之间的距离
const calculateDistance = (p1: [number, number], p2: [number, number]): number => {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (p1[1] * Math.PI) / 180;
  const φ2 = (p2[1] * Math.PI) / 180;
  const Δφ = ((p2[1] - p1[1]) * Math.PI) / 180;
  const Δλ = ((p2[0] - p1[0]) * Math.PI) / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // 米
};

// 找到最近的节点
const findNearestNode = (point: [number, number], nodes: Node[]): Node => {
  let nearestNode = nodes[0];
  let minDistance = calculateDistance(point, nodes[0].coordinates);
  
  for (let i = 1; i < nodes.length; i++) {
    const distance = calculateDistance(point, nodes[i].coordinates);
    if (distance < minDistance) {
      nearestNode = nodes[i];
      minDistance = distance;
    }
  }
  
  return nearestNode;
};

// 构建道路网络图
const buildGraph = (roadNetwork: any): Graph => {
  const graph = new Graph();
  let nodeIdCounter = 0;
  
  // 为每条道路线创建节点和边
  roadNetwork.features.forEach((feature: any) => {
    if (feature.geometry.type !== 'LineString' && feature.geometry.type !== 'MultiLineString') {
      return;
    }
    
    // 获取坐标
    let coordinates: [number, number][];
    if (feature.geometry.type === 'LineString') {
      coordinates = feature.geometry.coordinates as [number, number][];
    } else { // MultiLineString
      // 简化处理，只取第一段
      coordinates = feature.geometry.coordinates[0] as [number, number][];
    }
    
    if (coordinates.length < 2) return;
    
    // 为线的端点创建节点
    const startNodeId = `node-${nodeIdCounter++}`;
    const endNodeId = `node-${nodeIdCounter++}`;
    
    graph.addNode(startNodeId, coordinates[0]);
    graph.addNode(endNodeId, coordinates[coordinates.length - 1]);
    
    // 创建边（双向边）
    const distance = coordinates.reduce((sum, curr, i) => {
      if (i === 0) return 0;
      return sum + calculateDistance(coordinates[i-1], curr);
    }, 0);
    
    graph.addEdge(startNodeId, endNodeId, distance, coordinates);
    graph.addEdge(endNodeId, startNodeId, distance, [...coordinates].reverse());
  });
  
  return graph;
};

// Dijkstra最短路径算法
const findShortestPath = (graph: Graph, startNodeId: string, endNodeId: string): [number, number][] | null => {
  // 距离表
  const distances = new Map<string, number>();
  // 前驱节点表
  const previousNodes = new Map<string, string | null>();
  // 边的坐标表
  const edgeCoordinates = new Map<string, [number, number][]>();
  // 已访问节点集合
  const visited = new Set<string>();
  
  // 初始化
  graph.getAllNodes().forEach(node => {
    distances.set(node.id, Infinity);
    previousNodes.set(node.id, null);
  });
  
  distances.set(startNodeId, 0);
  
  while (visited.size < graph.nodes.size) {
    // 找出未访问节点中距离最小的节点
    let currentNodeId: string | null = null;
    let minDistance = Infinity;
    
    distances.forEach((distance, nodeId) => {
      if (!visited.has(nodeId) && distance < minDistance) {
        minDistance = distance;
        currentNodeId = nodeId;
      }
    });
    
    // 如果没有可访问的节点或已到达终点，退出循环
    if (currentNodeId === null || currentNodeId === endNodeId) break;
    
    visited.add(currentNodeId);
    
    // 获取当前节点
    const currentNode = graph.getNode(currentNodeId);
    if (!currentNode) continue;
    
    // 遍历当前节点的所有边
    for (const edge of currentNode.edges) {
      if (visited.has(edge.to)) continue;
      
      const distance = distances.get(currentNodeId)! + edge.weight;
      
      if (distance < distances.get(edge.to)!) {
        distances.set(edge.to, distance);
        previousNodes.set(edge.to, currentNodeId);
        edgeCoordinates.set(`${currentNodeId}-${edge.to}`, edge.coordinates);
      }
    }
  }
  
  // 重建路径
  if (previousNodes.get(endNodeId) === null) {
    return null; // 无法到达终点
  }
  
  // 通过前驱节点表重建路径
  const path: [number, number][] = [];
  let currentNodeId: string | null = endNodeId;
  
  while (currentNodeId !== null) {
    const previousNodeId: string | null = previousNodes.get(currentNodeId) || null;
    if (previousNodeId !== null) {
      // 获取边的坐标
      const edgeKey = `${previousNodeId}-${currentNodeId}`;
      const coordinates = edgeCoordinates.get(edgeKey);
      
      if (coordinates) {
        // 添加到路径（反向添加）
        path.unshift(...coordinates);
      } else {
        // 如果没有边坐标，则添加节点坐标
        const currentNode = graph.getNode(currentNodeId);
        if (currentNode) {
          path.unshift(currentNode.coordinates);
        }
      }
    } else {
      // 起点
      const startNode = graph.getNode(currentNodeId);
      if (startNode) {
        path.unshift(startNode.coordinates);
      }
    }
    
    currentNodeId = previousNodeId;
  }
  
  return path;
};

/**
 * 在道路网络中规划路线
 * 使用Dijkstra算法查找最短路径
 */
export const findRouteOnRoadNetwork = (
  roadNetwork: any,
  startPoint: [number, number],
  endPoint: [number, number]
): [number, number][] => {
  // 检查是否有有效的道路网络数据
  if (!roadNetwork?.features || roadNetwork.features.length === 0) {
    console.warn('未提供有效的道路网络数据，使用直线路径');
    return [startPoint, endPoint];
  }
  
  try {
    console.log('开始构建道路网络图...');
    // 构建道路网络图
    const graph = buildGraph(roadNetwork);
    console.log(`图构建完成，包含 ${graph.nodes.size} 个节点`);
    
    if (graph.nodes.size === 0) {
      console.warn('道路网络图为空，使用直线路径');
      return [startPoint, endPoint];
    }
    
    // 找到起点和终点最近的节点
    const nodes = graph.getAllNodes();
    const nearestStartNode = findNearestNode(startPoint, nodes);
    const nearestEndNode = findNearestNode(endPoint, nodes);
    
    console.log(`找到最近节点: 起点 ${nearestStartNode.id}, 终点 ${nearestEndNode.id}`);
    
    // 使用Dijkstra算法查找最短路径
    const path = findShortestPath(graph, nearestStartNode.id, nearestEndNode.id);
    
    if (!path || path.length === 0) {
      console.warn('未找到有效路径，使用直线路径');
      return [startPoint, endPoint];
    }
    
    console.log(`找到路径，包含 ${path.length} 个点`);
    
    // 确保路径包含起点和终点
    const resultPath: [number, number][] = [startPoint];
    
    // 添加路径中间点
    resultPath.push(...path);
    
    // 添加终点
    resultPath.push(endPoint);
    
    return resultPath;
  } catch (err) {
    console.error('路径查找出错:', err);
    return [startPoint, endPoint];
  }
}; 