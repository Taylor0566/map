import { create } from 'zustand';

// LayerItem类型定义
export type LayerType = 'vector' | 'raster' | 'hexbin' | 'choropleth' | 'bubble' | 'heatmap' | 'geojson' | 'other';
export interface LayerItem {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  source?: string;
  sourceLayer?: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  minZoom?: number;
  maxZoom?: number;
  group?: string;
  dataType?: 'population' | 'gdp' | 'urbanization' | 'health' | 'landuse';
  region?: 'china' | 'guangdong' | 'shenzhen';
  onToggle?: (visible: boolean) => void;
  fillColor?: string;
}

// 路线交通方式类型
export type RouteMode = 'driving' | 'walking' | 'transit';

// 路线点位类型
export interface RoutePoint {
  name: string;
  lnglat: [number, number];
}

// 路线类型
export interface Route {
  id: string;
  name: string;
  distance: number; // 米
  duration: number; // 秒
  mode: RouteMode;
  points: RoutePoint[];
  path: [number, number][]; // 路线坐标点
  steps: {
    instruction: string;
    distance: number;
    duration: number;
    path: [number, number][];
  }[];
}

interface MapState {
  mapLoaded: boolean;
  setMapLoaded: (v: boolean) => void;

  layers: LayerItem[];
  setLayers: (layers: LayerItem[]) => void;

  sidebar: { isOpen: boolean; type: 'search' | 'draw' | 'layers' | 'history' | 'routing' | null };
  setSidebar: (sidebar: { isOpen: boolean; type: 'search' | 'draw' | 'layers' | 'history' | 'routing' | null }) => void;

  showDataPanel: boolean;
  setShowDataPanel: (v: boolean) => void;

  activeLayerId: string | null;
  setActiveLayerId: (id: string | null) => void;

  selectedLayerName: string;
  setSelectedLayerName: (name: string) => void;

  layerData: any[];
  setLayerData: (data: any[]) => void;

  chartOverlays: any[];
  setChartOverlays: (overlays: any[]) => void;

  geoJsonData: { [key: string]: any };
  setGeoJsonData: (data: { [key: string]: any }) => void;
  geoJsonLoading: boolean;
  setGeoJsonLoading: (loading: boolean) => void;

  // 添加历史地图比对相关状态
  historyMaps: {id: string, name: string, year: number, visible: boolean, opacity?: number}[];
  setHistoryMaps: (maps: {id: string, name: string, year: number, visible: boolean, opacity?: number}[]) => void;
  activeHistoryMapId: string | null;
  setActiveHistoryMapId: (id: string | null) => void;

  // 添加路线规划相关状态
  startPoint: RoutePoint | null;
  setStartPoint: (point: RoutePoint | null) => void;
  endPoint: RoutePoint | null;
  setEndPoint: (point: RoutePoint | null) => void;
  waypoints: RoutePoint[];
  setWaypoints: (points: RoutePoint[]) => void;
  routeMode: RouteMode;
  setRouteMode: (mode: RouteMode) => void;
  currentRoute: Route | null;
  setCurrentRoute: (route: Route | null) => void;
  routeLoading: boolean;
  setRouteLoading: (loading: boolean) => void;
  routeError: string | null;
  setRouteError: (error: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapLoaded: false,
  setMapLoaded: (v) => set({ mapLoaded: v }),

  layers: [],
  setLayers: (layers) => set({ layers }),

  sidebar: { isOpen: false, type: null },
  setSidebar: (sidebar) => set({ sidebar }),

  showDataPanel: false,
  setShowDataPanel: (v) => set({ showDataPanel: v }),

  activeLayerId: null,
  setActiveLayerId: (id) => set({ activeLayerId: id }),

  selectedLayerName: '',
  setSelectedLayerName: (name) => set({ selectedLayerName: name }),

  layerData: [],
  setLayerData: (data) => set({ layerData: data }),

  chartOverlays: [],
  setChartOverlays: (overlays) => set({ chartOverlays: overlays }),

  geoJsonData: {},
  setGeoJsonData: (data) => set({ geoJsonData: data }),
  geoJsonLoading: false,
  setGeoJsonLoading: (loading) => set({ geoJsonLoading: loading }),
  
  // 添加历史地图状态初始值
  historyMaps: [
    { id: 'history-2010', name: '2010年影像', year: 2010, visible: false, opacity: 0.7 },
    { id: 'history-2000', name: '2000年影像', year: 2000, visible: false, opacity: 0.7 },
    { id: 'history-1990', name: '1990年影像', year: 1990, visible: false, opacity: 0.7 }
  ],
  setHistoryMaps: (maps) => set({ historyMaps: maps }),
  activeHistoryMapId: null,
  setActiveHistoryMapId: (id) => set({ activeHistoryMapId: id }),
  
  // 添加路线规划相关状态初始值
  startPoint: null,
  setStartPoint: (point) => set({ startPoint: point }),
  endPoint: null,
  setEndPoint: (point) => set({ endPoint: point }),
  waypoints: [],
  setWaypoints: (points) => set({ waypoints: points }),
  routeMode: 'driving',
  setRouteMode: (mode) => set({ routeMode: mode }),
  currentRoute: null,
  setCurrentRoute: (route) => set({ currentRoute: route }),
  routeLoading: false,
  setRouteLoading: (loading) => set({ routeLoading: loading }),
  routeError: null,
  setRouteError: (error) => set({ routeError: error }),
})); 