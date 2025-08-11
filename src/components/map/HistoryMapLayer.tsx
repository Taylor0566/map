import React, { useEffect, useState } from 'react';
import { TIANDITU_API_KEY } from '../../config/api-keys';
import { useMapStore } from '../../stores/mapStore';

interface HistoryMapLayerProps {
  map: any;  // 天地图实例
  id: string;
  year: number;
  visible: boolean;
  opacity: number;
  onLoad?: () => void;
}

/**
 * 历史地图图层组件
 * 将历史地图作为叠加图层显示在基础地图上
 */
const HistoryMapLayer: React.FC<HistoryMapLayerProps> = ({ 
  map, 
  id, 
  year, 
  visible, 
  opacity = 0.7,
  onLoad 
}) => {
  const [layerId] = useState(`${id}-${Math.random().toString(36).substring(2, 9)}`);
  const [layerInstance, setLayerInstance] = useState<any>(null);

  // 根据年份获取不同的历史影像图层URL
  const getHistoryTileUrl = (year: number) => {
    // 这里应该根据实际的历史影像服务来配置URL
    // 示例实现，实际项目中需要替换为真实的历史影像服务
    return (x: number, y: number, z: number) => {
      // 这里可以根据年份返回不同的图层URL
      // 实际项目中，这里应该连接到历史影像服务
      // 由于没有真实的历史影像服务，暂时使用不同颜色滤镜的影像作为示例
      let filterParams = '';
      if (year === 2000) {
        // 为2000年的图层添加偏棕色滤镜
        filterParams = '&FILTER=sepia(40%)';
      } else if (year === 1990) {
        // 为1990年的图层添加灰度滤镜
        filterParams = '&FILTER=grayscale(80%)';
      }
      
      // 使用天地图影像作为模拟，实际项目中应替换为历史影像
      return `/tianditu/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${TIANDITU_API_KEY}${filterParams}`;
    };
  };

  // 创建并加载历史地图图层
  useEffect(() => {
    if (!map || !window.T) return;

    try {
      // 创建图层
      const layer = new window.T.TileLayer(layerId, {
        getTileUrl: getHistoryTileUrl(year),
        minZoom: 1,
        maxZoom: 18
      });

      // 保存图层实例
      setLayerInstance(layer);

      // 如果设为可见，则添加到地图
      if (visible) {
        map.addLayer(layer);
        // 设置图层不透明度
        if (layer.setOpacity && typeof layer.setOpacity === 'function') {
          layer.setOpacity(opacity);
        }
      }

      // 通知加载完成
      if (onLoad) onLoad();

      // 清理函数
      return () => {
        try {
          map.removeLayer(layer);
        } catch (err) {
          console.warn('移除历史地图图层失败:', err);
        }
      };
    } catch (err) {
      console.error('加载历史地图图层失败:', err);
    }
  }, [map]);

  // 处理可见性和透明度变化
  useEffect(() => {
    if (!map || !layerInstance) return;

    try {
      if (visible) {
        // 先检查图层是否已添加到地图
        let isLayerAdded = false;
        if (map.getLayers) {
          const mapLayers = map.getLayers();
          if (mapLayers) {
            for (let i = 0; i < mapLayers.length; i++) {
              if (mapLayers[i] === layerInstance) {
                isLayerAdded = true;
                break;
              }
            }
          }
        }
        
        // 如果图层未添加，则添加到地图
        if (!isLayerAdded) {
          map.addLayer(layerInstance);
        }
        
        // 设置图层不透明度
        if (layerInstance.setOpacity && typeof layerInstance.setOpacity === 'function') {
          layerInstance.setOpacity(opacity);
          console.log(`设置历史地图图层(${id})不透明度:`, opacity);
        }
      } else {
        map.removeLayer(layerInstance);
      }
    } catch (err) {
      console.error('更新历史地图可见性或不透明度失败:', err);
    }
  }, [map, layerInstance, visible, opacity, id]);

  return null; // 这是一个功能性组件，不渲染任何内容
};

export default HistoryMapLayer; 