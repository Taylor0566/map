import React, { useEffect, useState } from 'react';
import { Route } from '../../stores/mapStore';
import { routeToPolyline, routePointToMarker } from '../../api/routingService';

interface RouteLayerProps {
  map: any; // 天地图实例
  route: Route;
  visible: boolean;
}

/**
 * 路线图层组件
 * 在地图上渲染路线和标记点
 */
const RouteLayer: React.FC<RouteLayerProps> = ({ map, route, visible }) => {
  const [polyline, setPolyline] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // 创建和管理路线图层
  useEffect(() => {
    if (!map || !route) return;
    
    // 确保天地图API已加载
    if (!window.T) {
      console.warn('天地图API未加载，无法创建路线图层');
      return;
    }

    // 清理现有图层
    const cleanup = () => {
      if (polyline) {
        try {
          map.removeOverLay(polyline);
        } catch (err) {
          console.warn('移除路线失败:', err);
        }
      }

      markers.forEach(marker => {
        try {
          map.removeOverLay(marker);
        } catch (err) {
          console.warn('移除标记点失败:', err);
        }
      });
    };

    // 如果不可见，只进行清理
    if (!visible) {
      cleanup();
      return;
    }

    // 清理旧图层
    cleanup();

    try {
      // 创建路线
      const polylineOptions = routeToPolyline(route);
      if (polylineOptions) {
        const newPolyline = new window.T.Polyline(
          polylineOptions.path,
          {
            color: polylineOptions.color,
            weight: polylineOptions.weight,
            opacity: polylineOptions.opacity,
            lineStyle: polylineOptions.lineStyle
          }
        );
        map.addOverLay(newPolyline);
        setPolyline(newPolyline);
      }

      // 创建标记点
      const newMarkers = [];
      
      // 起点标记
      const startMarkerOptions = routePointToMarker(route.points[0], 'start');
      if (startMarkerOptions) {
        const startIcon = new window.T.Icon(startMarkerOptions.iconOptions);
        
        const startMarker = new window.T.Marker(startMarkerOptions.position, {
          icon: startIcon,
          title: startMarkerOptions.title
        });
        
        map.addOverLay(startMarker);
        newMarkers.push(startMarker);
      }
      
      // 终点标记
      const endMarkerOptions = routePointToMarker(route.points[route.points.length - 1], 'end');
      if (endMarkerOptions) {
        const endIcon = new window.T.Icon(endMarkerOptions.iconOptions);
        
        const endMarker = new window.T.Marker(endMarkerOptions.position, {
          icon: endIcon,
          title: endMarkerOptions.title
        });
        
        map.addOverLay(endMarker);
        newMarkers.push(endMarker);
      }
      
      // 途经点标记
      for (let i = 1; i < route.points.length - 1; i++) {
        const waypointOptions = routePointToMarker(route.points[i], 'waypoint');
        if (waypointOptions) {
          const waypointIcon = new window.T.Icon(waypointOptions.iconOptions);
          
          const waypointMarker = new window.T.Marker(waypointOptions.position, {
            icon: waypointIcon,
            title: waypointOptions.title
          });
          
          map.addOverLay(waypointMarker);
          newMarkers.push(waypointMarker);
        }
      }
      
      setMarkers(newMarkers);

      // 调整地图以包含整条路线
      const bounds = new window.T.LngLatBounds();
      route.path.forEach(point => {
        bounds.extend(new window.T.LngLat(point[0], point[1]));
      });
      // 使用天地图API的正确方法设置地图视图
      map.panTo(bounds.getCenter());
      
      // 适应路线视图 - 天地图使用setViewport方法而非setZoomAndCenter
      try {
        // 尝试使用fitBounds方法（如果可用）
        if (map.fitBounds && typeof map.fitBounds === 'function') {
          map.fitBounds(bounds);
        } else {
          // 备用方案：使用panTo和setZoom
          const currentZoom = map.getZoom();
          map.panTo(bounds.getCenter());
          map.setZoom(currentZoom - 1); // 略微缩小以显示整条路线
        }
      } catch (viewErr) {
        console.warn('设置地图视图失败，使用简单居中:', viewErr);
        map.panTo(bounds.getCenter());
      }

    } catch (err) {
      console.error('创建路线图层失败:', err);
    }

    return cleanup;
  }, [map, route, visible]);

  return null; // 功能组件不渲染任何内容
};

export default RouteLayer; 