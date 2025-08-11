import React, { useState, useEffect } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { X, Eye, EyeOff, Clock } from 'lucide-react';

interface HistorySidebarProps {
  onClose: () => void;
}

/**
 * 历史地图比对侧边栏组件
 * 用于选择和控制历史地图图层
 */
const HistorySidebar: React.FC<HistorySidebarProps> = ({ onClose }) => {
  const historyMaps = useMapStore(s => s.historyMaps);
  const setHistoryMaps = useMapStore(s => s.setHistoryMaps);
  const activeHistoryMapId = useMapStore(s => s.activeHistoryMapId);
  const setActiveHistoryMapId = useMapStore(s => s.setActiveHistoryMapId);
  const [opacity, setOpacity] = useState(0.7);
  const [showSplitView, setShowSplitView] = useState(false);

  // 切换地图图层可见性
  const toggleMapVisibility = (id: string) => {
    setHistoryMaps(
      historyMaps.map(map => 
        map.id === id 
          ? { ...map, visible: !map.visible } 
          : map
      )
    );
    
    // 如果正在设为可见状态，也设置为当前激活图层
    const targetMap = historyMaps.find(m => m.id === id);
    if (targetMap && !targetMap.visible) {
      setActiveHistoryMapId(id);
    }
  };

  // 设置当前激活的历史地图
  const setActiveMap = (id: string) => {
    setActiveHistoryMapId(id);
    // 确保该图层可见
    if (!historyMaps.find(m => m.id === id)?.visible) {
      toggleMapVisibility(id);
    }
  };
  
  // 当透明度变化时，更新所有显示的历史地图图层
  useEffect(() => {
    // 应用透明度到所有可见的历史地图
    setHistoryMaps(
      historyMaps.map(map => 
        map.visible 
          ? { ...map, opacity } 
          : map
      )
    );
  }, [opacity]); // 仅当透明度变化时执行

  // 侧边栏样式
  const sidebarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '300px',
    height: '100%',
    backgroundColor: 'white',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
    zIndex: 1000,
    padding: '15px',
    overflowY: 'auto'
  };

  // 列表项样式
  const listItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '8px',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5'
  };

  return (
    <div style={sidebarStyle}>
      {/* 标题栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>历史地图比对</h2>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* 透明度控制 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          透明度: {opacity.toFixed(1)}
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={opacity}
          onChange={e => setOpacity(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* 显示模式选择 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>显示模式</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            style={{ 
              flex: 1, 
              padding: '8px', 
              background: !showSplitView ? '#1890ff' : '#f0f0f0',
              color: !showSplitView ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setShowSplitView(false)}
          >
            叠加模式
          </button>
          <button
            style={{ 
              flex: 1, 
              padding: '8px', 
              background: showSplitView ? '#1890ff' : '#f0f0f0',
              color: showSplitView ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setShowSplitView(true)}
          >
            分屏比对
          </button>
        </div>
      </div>

      {/* 历史地图列表 */}
      <div>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>可用历史地图</h3>
        {historyMaps.map(map => (
          <div 
            key={map.id} 
            style={{
              ...listItemStyle,
              border: activeHistoryMapId === map.id ? '2px solid #1890ff' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} />
              <span>{map.name}</span>
            </div>
            <div>
              <button 
                onClick={() => toggleMapVisibility(map.id)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
                title={map.visible ? '隐藏' : '显示'}
              >
                {map.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button 
                onClick={() => setActiveMap(map.id)}
                style={{ 
                  background: activeHistoryMapId === map.id ? '#1890ff' : '#f0f0f0',
                  color: activeHistoryMapId === map.id ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                激活
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 使用说明 */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>使用说明</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
          <li>选择需要查看的历史地图年份</li>
          <li>调整透明度以比对变化</li>
          <li>切换显示模式可以不同方式查看地图</li>
        </ul>
      </div>
    </div>
  );
};

export default HistorySidebar; 