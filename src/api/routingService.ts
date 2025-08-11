import { Route, RouteMode, RoutePoint } from '../stores/mapStore';
import { TIANDITU_API_KEY } from '../config/api-keys';
import { getRoadNetwork, findRouteOnRoadNetwork } from './tiandituWfsService';

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 10);

// 将路线点转换为请求参数格式
const formatPoint = (point: RoutePoint) => {
  return `${point.lnglat[0]},${point.lnglat[1]}`;
};

/**
 * 获取两点间路线规划
 * 
 * @param startPoint 起点
 * @param endPoint 终点
 * @param waypoints 途经点（可选）
 * @param mode 出行方式
 * @returns 路线信息
 */
export const getRoute = async (
  startPoint: RoutePoint,
  endPoint: RoutePoint,
  waypoints: RoutePoint[] = [],
  mode: RouteMode = 'driving'
): Promise<Route> => {
  try {
    // 设置请求loading状态
    console.log(`开始规划路线: 从${startPoint.name}到${endPoint.name}, 方式: ${mode}`);
    
    // 尝试使用天地图WFS服务获取路线
    // 注意：天地图WFS可能需要配置跨域代理
    let path: [number, number][] = [];
    
    try {
      // 尝试使用天地图WFS获取道路网络
      if (mode === 'driving') {
        // 公路数据仅在驾车模式下使用
        const roadNetwork = await getRoadNetwork(startPoint.lnglat, endPoint.lnglat);
        // 在道路网络上查找路径
        path = findRouteOnRoadNetwork(roadNetwork, startPoint.lnglat, endPoint.lnglat);
      }
    } catch (err) {
      console.warn('使用天地图WFS服务获取路线失败，将使用模拟路径:', err);
      path = []; // 清空路径，使用模拟路径
    }
    
    // 如果天地图WFS获取路径失败，则使用模拟路径
    if (!path || path.length === 0) {
      const response = await simulateRouteRequest(startPoint, endPoint, waypoints, mode);
      return response;
    }
    
    // 构建路线详情，但使用真实道路网络数据
    // 计算总距离和时间
    const totalDistance = calculatePathDistance(path);
    const speed = getAverageSpeed(mode);
    const duration = Math.round(totalDistance / speed);
    
    // 生成路线步骤
    const steps = generateRouteSteps(startPoint, endPoint, waypoints, path, mode);
    
    // 构建返回数据
    const route: Route = {
      id: generateId(),
      name: `${startPoint.name}到${endPoint.name}`,
      distance: Math.round(totalDistance),
      duration: duration,
      mode: mode,
      points: [startPoint, ...waypoints, endPoint],
      path: path,
      steps: steps
    };
    
    return route;
  } catch (error) {
    console.error('路线规划失败:', error);
    throw new Error('获取路线失败，请重试');
  }
};

/**
 * 计算路径总距离
 * @param path 路径坐标点
 * @returns 总距离（米）
 */
const calculatePathDistance = (path: [number, number][]): number => {
  let totalDistance = 0;
  
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += calculateDistance(path[i], path[i + 1]);
  }
  
  return totalDistance;
};

/**
 * 计算两点之间的距离（米）
 */
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

/**
 * 获取平均行驶速度（米/秒）
 */
const getAverageSpeed = (mode: RouteMode): number => {
  switch (mode) {
    case 'driving':
      return 40 * 1000 / 3600; // 40 km/h
    case 'walking':
      return 4 * 1000 / 3600; // 4 km/h
    case 'transit':
      return 25 * 1000 / 3600; // 25 km/h
    default:
      return 30 * 1000 / 3600; // 默认 30 km/h
  }
};

/**
 * 生成路线步骤
 */
const generateRouteSteps = (
  startPoint: RoutePoint,
  endPoint: RoutePoint,
  waypoints: RoutePoint[],
  path: [number, number][],
  mode: RouteMode
): any[] => {
  const steps = [];
  const directions = ['向北', '向东北', '向东', '向东南', '向南', '向西南', '向西', '向西北'];
  const roadTypes = ['沿主路', '沿辅路', '沿人行道', '沿小路'];
  const actions = ['直行', '左转', '右转', '掉头'];
  
  // 简化路径，仅保留关键点
  const simplifiedPath = simplifyPath(path);
  
  // 分段生成步骤
  let currentSegmentStart = 0;
  let currentDistance = 0;
  
  // 起点到第一个关键点
  const initialSegmentPath = path.slice(0, simplifiedPath[1] + 1);
  const initialDistance = calculatePathDistance(initialSegmentPath);
  const initialDuration = Math.round(initialDistance / getAverageSpeed(mode));
  const initialDirection = directions[Math.floor(Math.random() * directions.length)];
  const initialAction = actions[Math.floor(Math.random() * actions.length)];
  
  steps.push({
    instruction: `从${startPoint.name}出发，${initialDirection}${initialAction}`,
    distance: Math.round(initialDistance),
    duration: initialDuration,
    path: initialSegmentPath
  });
  
  currentDistance += initialDistance;
  currentSegmentStart = simplifiedPath[1];
  
  // 中间段
  for (let i = 1; i < simplifiedPath.length - 1; i++) {
    const segmentPath = path.slice(
      currentSegmentStart,
      simplifiedPath[i + 1] + 1
    );
    
    const segmentDistance = calculatePathDistance(segmentPath);
    const segmentDuration = Math.round(segmentDistance / getAverageSpeed(mode));
    
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const roadType = roadTypes[Math.floor(Math.random() * roadTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    // 如果这个点接近某个途经点，则提及途经点
    const waypointIndex = findNearestWaypoint(
      path[simplifiedPath[i]],
      waypoints.map(wp => wp.lnglat)
    );
    
    let instruction: string;
    if (waypointIndex !== -1) {
      instruction = `经过${waypoints[waypointIndex].name}，${direction}${roadType}${action}`;
    } else {
      instruction = `${direction}${roadType}${action}`;
    }
    
    steps.push({
      instruction,
      distance: Math.round(segmentDistance),
      duration: segmentDuration,
      path: segmentPath
    });
    
    currentDistance += segmentDistance;
    currentSegmentStart = simplifiedPath[i + 1];
  }
  
  // 最后一段到终点
  const finalSegmentPath = path.slice(currentSegmentStart);
  const finalDistance = calculatePathDistance(finalSegmentPath);
  const finalDuration = Math.round(finalDistance / getAverageSpeed(mode));
  const finalDirection = directions[Math.floor(Math.random() * directions.length)];
  const finalAction = actions[Math.floor(Math.random() * actions.length)];
  
  steps.push({
    instruction: `${finalDirection}${finalAction}，到达${endPoint.name}`,
    distance: Math.round(finalDistance),
    duration: finalDuration,
    path: finalSegmentPath
  });
  
  return steps;
};

/**
 * 简化路径，找出关键转弯点
 * 使用Douglas-Peucker简化算法的简化版
 */
const simplifyPath = (path: [number, number][]): number[] => {
  if (path.length <= 2) return [0, path.length - 1];
  
  // 仅做简单的角度变化检测
  const keyPoints = [0]; // 起点
  const threshold = 20; // 角度变化阈值（度）
  
  for (let i = 1; i < path.length - 1; i++) {
    const angle1 = calculateBearing(path[i-1], path[i]);
    const angle2 = calculateBearing(path[i], path[i+1]);
    const angleDiff = Math.abs(angleDifference(angle1, angle2));
    
    if (angleDiff > threshold) {
      keyPoints.push(i);
    }
  }
  
  keyPoints.push(path.length - 1); // 终点
  return keyPoints;
};

/**
 * 计算两点之间的方位角
 */
const calculateBearing = (start: [number, number], end: [number, number]): number => {
  const startLat = start[1] * Math.PI / 180;
  const startLng = start[0] * Math.PI / 180;
  const endLat = end[1] * Math.PI / 180;
  const endLng = end[0] * Math.PI / 180;
  
  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // 转换为0-360度
};

/**
 * 计算两个角度之间的差值
 */
const angleDifference = (angle1: number, angle2: number): number => {
  let diff = angle2 - angle1;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
};

/**
 * 查找离给定点最近的途经点索引
 */
const findNearestWaypoint = (point: [number, number], waypointCoords: [number, number][]): number => {
  if (waypointCoords.length === 0) return -1;
  
  const threshold = 0.001; // 大约100米的经纬度阈值
  
  for (let i = 0; i < waypointCoords.length; i++) {
    const wp = waypointCoords[i];
    const distance = Math.sqrt(
      Math.pow(point[0] - wp[0], 2) + Math.pow(point[1] - wp[1], 2)
    );
    
    if (distance < threshold) {
      return i;
    }
  }
  
  return -1;
};

/**
 * 模拟路线规划请求
 * 注意: 实际项目中应替换为真实的天地图API调用
 */
const simulateRouteRequest = async (
  startPoint: RoutePoint,
  endPoint: RoutePoint,
  waypoints: RoutePoint[],
  mode: RouteMode
): Promise<Route> => {
  return new Promise((resolve) => {
    // 模拟网络延迟
    setTimeout(() => {
      // 生成路线路径点
      const generatePath = (start: [number, number], end: [number, number], pointCount = 10) => {
        const path: [number, number][] = [start];
        
        for (let i = 1; i < pointCount - 1; i++) {
          const ratio = i / pointCount;
          const lng = start[0] + (end[0] - start[0]) * ratio + (Math.random() - 0.5) * 0.01;
          const lat = start[1] + (end[1] - start[1]) * ratio + (Math.random() - 0.5) * 0.01;
          path.push([lng, lat]);
        }
        
        path.push(end);
        return path;
      };
      
      // 计算所有点之间的总路程
      let allPoints = [startPoint.lnglat, ...waypoints.map(wp => wp.lnglat), endPoint.lnglat];
      let totalDistance = 0;
      
      for (let i = 0; i < allPoints.length - 1; i++) {
        totalDistance += calculateDistance(allPoints[i], allPoints[i + 1]);
      }
      
      // 生成完整路径
      const completePath: [number, number][] = [];
      for (let i = 0; i < allPoints.length - 1; i++) {
        const segmentPath = generatePath(allPoints[i], allPoints[i + 1]);
        completePath.push(...(i === 0 ? segmentPath : segmentPath.slice(1)));
      }
      
      const speed = getAverageSpeed(mode);
      const duration = Math.round(totalDistance / speed);
      
      // 生成导航步骤
      const steps = generateRouteSteps(startPoint, endPoint, waypoints, completePath, mode);
      
      // 构建返回数据
      const route: Route = {
        id: generateId(),
        name: `${startPoint.name}到${endPoint.name}`,
        distance: Math.round(totalDistance),
        duration: duration,
        mode: mode,
        points: [startPoint, ...waypoints, endPoint],
        path: completePath,
        steps: steps
      };
      
      resolve(route);
    }, 800); // 模拟请求延迟
  });
};

/**
 * 将路线信息转换为天地图可用的线条格式
 * @param route 路线信息
 * @returns 天地图线条参数
 */
export const routeToPolyline = (route: Route) => {
  if (!route || !route.path) return null;
  
  // 根据不同交通方式设置不同颜色
  let color: string;
  switch (route.mode) {
    case 'driving':
      color = '#3388ff'; // 蓝色
      break;
    case 'walking':
      color = '#33cc33'; // 绿色
      break;
    case 'transit':
      color = '#ff6600'; // 橙色
      break;
    default:
      color = '#3388ff';
  }
  
  return {
    path: route.path.map(point => new window.T.LngLat(point[0], point[1])),
    color: color,
    weight: 5,
    opacity: 0.8,
    lineStyle: 'solid'
  };
};

/**
 * 将路线点转换为天地图标记点
 * @param point 路线点
 * @param type 点类型
 * @returns 天地图标记参数
 */
export const routePointToMarker = (point: RoutePoint, type: 'start' | 'end' | 'waypoint') => {
  if (!point || !point.lnglat) return null;
  
  // 使用内联SVG创建标记点图标，避免依赖外部图片文件
  let iconOptions;
  switch (type) {
    case 'start':
      // 使用天地图内置图标
      iconOptions = {
        iconUrl: 'http://api.tianditu.gov.cn/img/map/markerA.png',
        iconSize: new window.T.Point(25, 41),
        iconAnchor: new window.T.Point(12, 41)
      };
      break;
    case 'end':
      iconOptions = {
        iconUrl: 'http://api.tianditu.gov.cn/img/map/markerB.png',
        iconSize: new window.T.Point(25, 41),
        iconAnchor: new window.T.Point(12, 41)
      };
      break;
    case 'waypoint':
      // 自定义图标选项
      iconOptions = {
        iconUrl: 'http://api.tianditu.gov.cn/img/map/waypoint.png',
        iconSize: new window.T.Point(20, 20),
        iconAnchor: new window.T.Point(10, 20)
      };
      break;
    default:
      // 默认标记
      iconOptions = {
        iconUrl: 'http://api.tianditu.gov.cn/img/map/marker_red.png',
        iconSize: new window.T.Point(25, 41),
        iconAnchor: new window.T.Point(12, 41)
      };
  }
  
  return {
    position: new window.T.LngLat(point.lnglat[0], point.lnglat[1]),
    iconOptions: iconOptions,
    title: point.name
  };
}; 