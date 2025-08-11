import React, { useState, useEffect } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { X, Navigation, Clock, MapPin, Plus, Trash2, Car, PersonStanding, Bus } from 'lucide-react';
import { getRoute } from '../../api/routingService';
import { RouteMode, RoutePoint } from '../../stores/mapStore';

interface RoutingSidebarProps {
  onClose: () => void;
  mapRef: React.MutableRefObject<any>;
}

/**
 * 路线规划侧边栏组件
 */
const RoutingSidebar: React.FC<RoutingSidebarProps> = ({ onClose, mapRef }) => {
  const startPoint = useMapStore(s => s.startPoint);
  const setStartPoint = useMapStore(s => s.setStartPoint);
  const endPoint = useMapStore(s => s.endPoint);
  const setEndPoint = useMapStore(s => s.setEndPoint);
  const waypoints = useMapStore(s => s.waypoints);
  const setWaypoints = useMapStore(s => s.setWaypoints);
  const routeMode = useMapStore(s => s.routeMode);
  const setRouteMode = useMapStore(s => s.setRouteMode);
  const currentRoute = useMapStore(s => s.currentRoute);
  const setCurrentRoute = useMapStore(s => s.setCurrentRoute);
  const routeLoading = useMapStore(s => s.routeLoading);
  const setRouteLoading = useMapStore(s => s.setRouteLoading);
  const routeError = useMapStore(s => s.routeError);
  const setRouteError = useMapStore(s => s.setRouteError);

  // 临时存储地点输入
  const [startInput, setStartInput] = useState(startPoint?.name || '');
  const [endInput, setEndInput] = useState(endPoint?.name || '');
  const [waypointInputs, setWaypointInputs] = useState<string[]>(waypoints.map(wp => wp.name));

  // 点击地图选择位置时当前正在编辑的输入框
  const [activeInput, setActiveInput] = useState<'start' | 'end' | number | null>(null);

  // 初始化示例位置
  useEffect(() => {
    if (!startPoint && !endPoint) {
      // 设置默认起点和终点示例
      setStartPoint({
        name: '深圳市中心',
        lnglat: [114.0579, 22.5431]
      });
      setEndPoint({
        name: '深圳湾公园',
        lnglat: [113.9355, 22.4931]
      });
    }
  }, []);

  // 点击地图设置位置
  useEffect(() => {
    if (!mapRef.current || !activeInput) return;

    const map = mapRef.current?.getMap?.();
    if (!map) return;
    
    const handleMapClick = (e: any) => {
      if (!e.lnglat) return;
      
      const lnglat: [number, number] = [e.lnglat.lng, e.lnglat.lat];
      const pointName = `位置 (${lnglat[0].toFixed(4)}, ${lnglat[1].toFixed(4)})`;
      
      // 根据当前活动输入框设置对应的点
      if (activeInput === 'start') {
        setStartPoint({ name: pointName, lnglat });
        setStartInput(pointName);
      } else if (activeInput === 'end') {
        setEndPoint({ name: pointName, lnglat });
        setEndInput(pointName);
      } else if (typeof activeInput === 'number') {
        const newWaypoints = [...waypoints];
        newWaypoints[activeInput] = { name: pointName, lnglat };
        setWaypoints(newWaypoints);
        
        const newInputs = [...waypointInputs];
        newInputs[activeInput] = pointName;
        setWaypointInputs(newInputs);
      }
      
      // 重置活动输入框
      setActiveInput(null);
      
      // 移除事件监听器
      map.removeEventListener('click', handleMapClick);
    };
    
    map.addEventListener('click', handleMapClick);
    
    // 清理函数
    return () => {
      map.removeEventListener('click', handleMapClick);
    };
  }, [activeInput, mapRef]);

  // 提交规划请求
  const handleSubmit = async () => {
    if (!startPoint || !endPoint) {
      setRouteError('请设置起点和终点');
      return;
    }
    
    try {
      setRouteLoading(true);
      setRouteError(null);
      
      const route = await getRoute(startPoint, endPoint, waypoints, routeMode);
      setCurrentRoute(route);
      
    } catch (error) {
      setRouteError(`路线规划失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRouteLoading(false);
    }
  };
  
  // 添加途经点
  const addWaypoint = () => {
    setWaypoints([...waypoints, { name: '', lnglat: [0, 0] }]);
    setWaypointInputs([...waypointInputs, '']);
  };
  
  // 删除途经点
  const removeWaypoint = (index: number) => {
    const newWaypoints = [...waypoints];
    newWaypoints.splice(index, 1);
    setWaypoints(newWaypoints);
    
    const newInputs = [...waypointInputs];
    newInputs.splice(index, 1);
    setWaypointInputs(newInputs);
  };

  // 格式化时间（秒转为时:分:秒）
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}分${s > 0 ? s + '秒' : ''}`;
    }
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}小时${m > 0 ? m + '分' : ''}`;
  };

  // 格式化距离（米转为公里或米）
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}米`;
    return `${(meters / 1000).toFixed(1)}公里`;
  };

  // 侧边栏样式
  const sidebarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '350px',
    height: '100%',
    backgroundColor: 'white',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
    zIndex: 1000,
    padding: '15px',
    overflowY: 'auto'
  };
  
  // 输入框容器样式
  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px'
  };
  
  // 输入框样式
  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: '4px',
    fontSize: '14px'
  };
  
  // 输入框样式（激活状态）
  const activeInputStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#1890ff',
    boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
  };
  
  // 图标按钮样式
  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    marginLeft: '5px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
        <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center' }}>
          <Navigation size={18} style={{ marginRight: '8px' }} />
          路线规划
        </h2>
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

      {/* 起点输入框 */}
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>起点</label>
      <div style={inputContainerStyle}>
        <input
          type="text"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
          placeholder="输入起点或点击地图选择"
          style={activeInput === 'start' ? activeInputStyle : inputStyle}
        />
        <button
          onClick={() => setActiveInput('start')}
          style={{
            ...iconButtonStyle,
            backgroundColor: activeInput === 'start' ? '#f0f0f0' : 'transparent'
          }}
          title="点击地图选择起点"
        >
          <MapPin size={16} color={activeInput === 'start' ? '#1890ff' : '#666'} />
        </button>
      </div>

      {/* 终点输入框 */}
      <label style={{ display: 'block', marginBottom: '5px', marginTop: '10px', fontWeight: 'bold' }}>终点</label>
      <div style={inputContainerStyle}>
        <input
          type="text"
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
          placeholder="输入终点或点击地图选择"
          style={activeInput === 'end' ? activeInputStyle : inputStyle}
        />
        <button
          onClick={() => setActiveInput('end')}
          style={{
            ...iconButtonStyle,
            backgroundColor: activeInput === 'end' ? '#f0f0f0' : 'transparent'
          }}
          title="点击地图选择终点"
        >
          <MapPin size={16} color={activeInput === 'end' ? '#1890ff' : '#666'} />
        </button>
      </div>

      {/* 途经点输入框 */}
      <div style={{ marginTop: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>途经点</label>
          <button
            onClick={addWaypoint}
            style={{
              ...iconButtonStyle,
              backgroundColor: '#f0f0f0',
              padding: '3px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px'
            }}
          >
            <Plus size={14} style={{ marginRight: '4px' }} />
            添加途经点
          </button>
        </div>
        
        {waypoints.map((waypoint, index) => (
          <div key={index} style={inputContainerStyle}>
            <input
              type="text"
              value={waypointInputs[index] || ''}
              onChange={(e) => {
                const newInputs = [...waypointInputs];
                newInputs[index] = e.target.value;
                setWaypointInputs(newInputs);
              }}
              placeholder={`途经点 ${index + 1}`}
              style={activeInput === index ? activeInputStyle : inputStyle}
            />
            <button
              onClick={() => setActiveInput(index)}
              style={{
                ...iconButtonStyle,
                backgroundColor: activeInput === index ? '#f0f0f0' : 'transparent'
              }}
              title="点击地图选择途经点"
            >
              <MapPin size={16} color={activeInput === index ? '#1890ff' : '#666'} />
            </button>
            <button
              onClick={() => removeWaypoint(index)}
              style={iconButtonStyle}
              title="删除此途经点"
            >
              <Trash2 size={16} color="#ff4d4f" />
            </button>
          </div>
        ))}
      </div>

      {/* 交通方式选择 */}
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>出行方式</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setRouteMode('driving')}
            style={{
              flex: 1,
              padding: '8px 0',
              backgroundColor: routeMode === 'driving' ? '#1890ff' : '#f5f5f5',
              color: routeMode === 'driving' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Car size={18} />
            <span style={{ fontSize: '14px' }}>驾车</span>
          </button>
          <button
            onClick={() => setRouteMode('walking')}
            style={{
              flex: 1,
              padding: '8px 0',
              backgroundColor: routeMode === 'walking' ? '#1890ff' : '#f5f5f5',
              color: routeMode === 'walking' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <PersonStanding size={18} />
            <span style={{ fontSize: '14px' }}>步行</span>
          </button>
          <button
            onClick={() => setRouteMode('transit')}
            style={{
              flex: 1,
              padding: '8px 0',
              backgroundColor: routeMode === 'transit' ? '#1890ff' : '#f5f5f5',
              color: routeMode === 'transit' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Bus size={18} />
            <span style={{ fontSize: '14px' }}>公交</span>
          </button>
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={routeLoading || !startPoint || !endPoint}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: routeLoading || !startPoint || !endPoint ? '#d9d9d9' : '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: routeLoading || !startPoint || !endPoint ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginTop: '10px'
        }}
      >
        {routeLoading ? '规划中...' : '开始规划路线'}
      </button>

      {/* 错误提示 */}
      {routeError && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fff1f0', 
          border: '1px solid #ffccc7', 
          color: '#f5222d',
          borderRadius: '4px',
          marginTop: '15px',
          fontSize: '14px'
        }}>
          {routeError}
        </div>
      )}

      {/* 路线结果 */}
      {currentRoute && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
            路线详情
          </h3>
          
          {/* 路线概览 */}
          <div style={{ 
            backgroundColor: '#f9f9f9', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
              {currentRoute.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: '14px' }}>
              <Clock size={16} style={{ marginRight: '5px' }} />
              <span>预计用时: {formatDuration(currentRoute.duration)}</span>
            </div>
            <div style={{ marginTop: '5px', color: '#666', fontSize: '14px' }}>
              总距离: {formatDistance(currentRoute.distance)}
            </div>
          </div>
          
          {/* 路线步骤 */}
          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>路线指引</h4>
            <ol style={{ 
              margin: 0, 
              padding: '0 0 0 20px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {currentRoute.steps.map((step, index) => (
                <li key={index} style={{ 
                  marginBottom: '10px',
                  fontSize: '14px',
                  padding: '8px',
                  backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent',
                  borderRadius: '4px'
                }}>
                  <div style={{ marginBottom: '4px' }}>{step.instruction}</div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>距离: {formatDistance(step.distance)}</span>
                    <span>用时: {formatDuration(step.duration)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutingSidebar; 