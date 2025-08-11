# 如何在其他项目中使用天地图GIS-API

## 步骤一：安装依赖

```bash
# 克隆项目
git clone [项目仓库地址]

# 安装依赖包
npm install
```

## 步骤二：环境配置

创建`.env.local`文件并设置必要环境变量：

```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## 步骤三：启动代理服务器

```bash
# 启动基础代理服务器
npm run basic-proxy

# 或启动完整代理服务器
npm run proxy
```

## 步骤四：引入组件和API

```tsx
import { useRef } from 'react';
import TiandituMap from '路径/components/TiandituMap';
import { createMapAPI, MapAPI } from '路径/api/MapAPI';

const MapComponent = () => {
  const mapRef = useRef<any>(null);
  let mapAPI: MapAPI;
  
  const handleMapLoaded = () => {
    mapAPI = createMapAPI(mapRef);
    
    // 使用API功能
    mapAPI.switchBasemap('img'); // 切换到影像图
  };
  
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <TiandituMap
        ref={mapRef}
        width="100%"
        height="100%"
        center={[114.0579, 22.5431]}
        zoom={12}
        onMapLoaded={handleMapLoaded}
      />
    </div>
  );
};
```

## 步骤五：常见功能示例

### 添加GeoJSON图层

```tsx
// 加载并添加GeoJSON数据
mapAPI.loadGeoJson('/data/china.geojson').then(data => {
  mapAPI.addLayer({
    id: 'china-borders',
    name: '中国边界',
    type: 'geojson',
    visible: true,
    opacity: 0.7,
    color: '#0066ff',
    fillColor: 'rgba(0, 102, 255, 0.2)',
    data: data
  });
});
```

### 切换底图类型

```typescript
// 切换到影像图
mapAPI.switchBasemap('img');

// 切换到矢量图
mapAPI.switchBasemap('vec');

// 切换到地形图
mapAPI.switchBasemap('ter');
```

### 监听地图事件

```tsx
mapAPI.on('click', (evt) => {
  const { lnglat } = evt;
  console.log('点击位置:', lnglat);
});
```

### 设置地图视图

```typescript
// 设置地图中心点
mapAPI.setCenter([116.3912, 39.9073]);

// 设置缩放级别
mapAPI.setZoom(12);

// 调整地图视图到指定范围
mapAPI.fitBounds([[115.0, 22.0], [115.5, 22.5]]);
```

## 步骤六：图层管理

### 添加和移除图层

```typescript
// 添加图层
const layerId = mapAPI.addLayer({
  id: 'my-geojson-layer',
  name: '自定义GeoJSON图层',
  type: 'geojson',
  visible: true,
  opacity: 0.7,
  color: '#ff0000',
  fillColor: 'rgba(255, 0, 0, 0.2)',
  data: geoJsonData // GeoJSON数据对象
});

// 移除图层
mapAPI.removeLayer('my-geojson-layer');
```

### 控制图层可见性和透明度

```typescript
// 切换图层可见性
mapAPI.toggleLayerVisibility('my-geojson-layer', false); // 隐藏图层

// 设置图层透明度
mapAPI.setLayerOpacity('my-geojson-layer', 0.5);
```

## 常见问题解决

如遇加载问题，请检查：
1. 天地图API密钥设置
2. 代理服务器运行状态
3. 浏览器控制台错误信息

## 性能优化建议

1. 根据视图范围按需加载GeoJSON数据
2. 对于大型GeoJSON数据，使用简化算法减少点数量
3. 根据缩放级别控制图层显示，避免同时渲染过多图层

## 步骤七：在侧边栏中集成地图

### 创建侧边栏地图组件

```tsx
import { useRef, useEffect } from 'react';
import TiandituMap from '路径/components/TiandituMap';
import { createMapAPI } from '路径/api/MapAPI';

const SidebarMapComponent = ({ isOpen }) => {
  const mapRef = useRef<any>(null);
  let mapAPI: MapAPI;
  
  useEffect(() => {
    // 当侧边栏打开且地图已加载时，刷新地图尺寸以适应容器
    if (isOpen && mapRef.current && mapAPI) {
      mapAPI.resize();
    }
  }, [isOpen]);
  
  const handleMapLoaded = () => {
    mapAPI = createMapAPI(mapRef);
    // 初始化地图设置
  };
  
  return (
    <div className="sidebar-map-container" style={{ width: '100%', height: '100%' }}>
      <TiandituMap
        ref={mapRef}
        width="100%"
        height="100%"
        center={[114.0579, 22.5431]}
        zoom={12}
        onMapLoaded={handleMapLoaded}
      />
    </div>
  );
};

export default SidebarMapComponent;
```

### 在宿主应用中集成侧边栏地图

```tsx
import { useState } from 'react';
import SidebarMapComponent from '路径/SidebarMapComponent';

const HostApplication = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="app-container">
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '关闭地图' : '打开地图'}
      </button>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {sidebarOpen && <SidebarMapComponent isOpen={sidebarOpen} />}
      </div>
    </div>
  );
};
```

### 侧边栏样式示例

```css
.app-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  position: fixed;
  right: 0;
  top: 0;
  height: 100%;
  background: white;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  overflow: hidden;
}

.sidebar.closed {
  transform: translateX(100%);
  width: 0;
}

.sidebar.open {
  transform: translateX(0);
  width: 400px; /* 侧边栏宽度 */
}

.sidebar-map-container {
  width: 100%;
  height: 100%;
}
```

### 侧边栏地图注意事项

1. **地图尺寸调整**：当侧边栏打开或尺寸变化时，必须调用`mapAPI.resize()`方法以确保地图正确渲染
2. **按需加载**：考虑在侧边栏打开时才渲染地图组件，关闭时销毁，以提高性能
3. **响应式设计**：确保地图容器能够适应不同设备的侧边栏尺寸
4. **事件处理**：为避免事件冲突，可能需要阻止地图事件冒泡到宿主应用

详细接口参考请查阅《天地图GIS-API接口技术文档》中的API接口说明部分。 

## 在侧边栏中集成天地图GIS组件

```
NEXT_PUBLIC_MAP
``` 