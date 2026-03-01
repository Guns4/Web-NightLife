/**
 * Type declarations for Google Maps JavaScript API
 * These types provide type safety for Google Maps API usage
 */

interface Window {
  google: typeof google;
}

declare namespace google {
  namespace maps {
    namespace marker {
      /**
       * AdvancedMarkerElement for displaying custom markers on the map
       * @see https://developers.google.com/maps/documentation/javascript/advanced-markers
       */
      class AdvancedMarkerElement {
        constructor(options?: AdvancedMarkerElementOptions);
        position?: LatLng | LatLngLiteral | { lat: number; lng: number };
        title?: string;
        map?: Map | null;
        content?: HTMLElement;
        zIndex?: number;
        addListener(eventType: string, handler: Function): maps.MapsEventListener;
      }

      interface AdvancedMarkerElementOptions {
        position?: LatLng | LatLngLiteral | { lat: number; lng: number };
        map?: Map;
        title?: string;
        content?: HTMLElement;
        zIndex?: number;
      }
    }

    namespace Data {
      class Data {
        constructor(options?: DataOptions);
        add(feature: Feature): void;
        remove(feature: Feature): void;
        setStyle(style: StyleFunction | FeatureStyle): void;
        forEach(callback: (feature: Feature) => void): void;
        loadGeoJson(url: string): void;
      }

      interface DataOptions {
        map?: Map;
        style?: StyleFunction | FeatureStyle;
      }

      type StyleFunction = (feature: Feature) => FeatureStyle;

      interface FeatureStyle {
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        icon?: string;
      }

      class Feature {
        getProperty(name: string): any;
        setProperty(name: string, value: any): void;
        removeProperty(name: string): void;
        getGeometry(): Geometry;
        setGeometry(geometry: Geometry | GeoJsonGeometry): void;
        toGeoJson(callback: (feature: object) => void): void;
      }

      type Geometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon | GeometryCollection;

      class Point {
        constructor(coordinates: LatLngLiteral);
        get(): LatLngLiteral;
      }

      class MultiPoint {
        constructor(elements: LatLng[]);
        forEach(callback: (latLng: LatLng) => void): void;
        getArray(): LatLng[];
        getAt(index: number): LatLng;
        getLength(): number;
      }

      class LineString {
        constructor(elements: LatLng[] | LatLngLiteral[]);
        getArray(): LatLng[];
        getAt(index: number): LatLng;
        getLength(): number;
      }

      class MultiLineString {
        constructor(elements: (LatLng[] | LatLngLiteral[])[]);
        getArray(): LineString[];
        getAt(index: number): LineString;
        getLength(): number;
      }

      class Polygon {
        constructor(elements: (LatLng[] | LatLngLiteral[])[]);
        getArray(): (LatLng[] | LatLngLiteral[])[];
        getAt(index: number): LatLng[];
        getLength(): number;
      }

      class MultiPolygon {
        constructor(elements: ((LatLng[] | LatLngLiteral[])[])[]);
        getArray(): Polygon[];
        getAt(index: number): Polygon;
        getLength(): number;
      }

      class GeometryCollection {
        constructor(elements: Geometry[]);
        getArray(): Geometry[];
        getAt(index: number): Geometry;
        getLength(): number;
      }

      type GeoJsonGeometry =
        | { type: 'Point'; coordinates: [number, number] }
        | { type: 'MultiPoint'; coordinates: [number, number][] }
        | { type: 'LineString'; coordinates: [number, number][] }
        | { type: 'MultiLineString'; coordinates: [number, number][][] }
        | { type: 'Polygon'; coordinates: [number, number][][] }
        | { type: 'MultiPolygon'; coordinates: [number, number][][][] }
        | { type: 'GeometryCollection'; geometries: GeoJsonGeometry[] };
    }

    /**
     * Map
     */
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      setOptions(options: MapOptions): void;
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      setHeading(heading: number): void;
      setTilt(tilt: number): void;
      fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
      panTo(latlng: LatLng | LatLngLiteral): void;
      panToBounds(latlngBounds: LatLngBounds, padding?: number | Padding): void;
      getCenter(): LatLng | null;
      getZoom(): number;
      getHeading(): number;
      getTilt(): number;
      getBounds(): LatLngBounds | null;
      getDiv(): HTMLElement;
      getStreetView(): StreetViewPanorama;
      getProjection(): Projection;
      setStreetView(panorama: StreetViewPanorama): void;
      data: Data;
      addListener(eventType: string, handler: Function): MapsEventListener;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      heading?: number;
      tilt?: number;
      mapId?: string;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      styles?: MapTypeStyle[];
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControlOptions?: MapTypeControlOptions;
      streetViewControlOptions?: StreetViewControlOptions;
      fullscreenControl?: boolean;
      fullscreenControlOptions?: FullscreenControlOptions;
      backgroundColor?: string;
    }

    /** Library types returned by importLibrary() */
    interface MapsLibrary {
      Map: typeof Map;
      MapTypeId: typeof MapTypeId;
      MapTypeStyle: MapTypeStyle;
    }

    interface MarkerLibrary {
      AdvancedMarkerElement: typeof marker.AdvancedMarkerElement;
      PinElement: new (options?: object) => HTMLElement;
    }

    /** importLibrary — dynamically load a Maps JS library */
    function importLibrary(libraryName: 'maps'): Promise<MapsLibrary>;
    function importLibrary(libraryName: 'marker'): Promise<MarkerLibrary>;
    function importLibrary(libraryName: string): Promise<unknown>;

    /**
     * LatLng
     */
    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      equals(other: LatLng): boolean;
      toString(): string;
      toUrlValue(precision?: number): string;
      toJSON(): LatLngLiteral;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    /**
     * LatLngBounds
     */
    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      equals(other: LatLngBounds): boolean;
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      intersects(other: LatLngBounds): boolean;
      isEmpty(): boolean;
      toString(): string;
      toUrlValue(precision?: number): string;
      toJSON(): { east: number; north: number; south: number; west: number };
    }

    /**
     * Marker
     */
    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      getMap(): Map | null;
      setPosition(position: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | null | undefined;
      setTitle(title: string): void;
      getTitle(): string | null;
      setLabel(label: string | MarkerLabel): void;
      getLabel(): MarkerLabel | null;
      setIcon(icon: string | MarkerImage | Symbol): void;
      getIcon(): string | MarkerImage | Symbol | null;
      setOpacity(opacity: number): void;
      getOpacity(): number | null;
      setVisible(visible: boolean): void;
      getVisible(): boolean;
      setZIndex(zIndex: number): void;
      getZIndex(): number | null;
      addListener(eventType: string, handler: Function): MapsEventListener;
    }

    interface MarkerOptions {
      position: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      label?: string | MarkerLabel;
      icon?: string | MarkerImage | Symbol;
      opacity?: number;
      visible?: boolean;
      zIndex?: number;
      clickable?: boolean;
      draggable?: boolean;
      animation?: Animation;
    }

    interface MarkerLabel {
      color?: string;
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: string;
      text: string;
    }

    interface MarkerImage {
      url: string;
      size?: Size;
      scaledSize?: Size;
      origin?: Point;
      anchor?: Point;
      labelOrigin?: Point;
    }

    /**
     * Symbol
     */
    interface Symbol {
      path: SymbolPath | string;
      fillColor?: string;
      fillOpacity?: number;
      rotation?: number;
      scale?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      anchor?: Point;
    }

    enum SymbolPath {
      CIRCLE = 0,
      BACKWARD_CLOSED_ARROW = 1,
      FORWARD_CLOSED_ARROW = 2,
      BACKWARD_OPEN_ARROW = 3,
      FORWARD_OPEN_ARROW = 4,
    }

    /**
     * Animation
     */
    enum Animation {
      BOUNCE = 1,
      DROP = 2,
    }

    /**
     * InfoWindow
     */
    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(options?: InfoWindowOpenOptions | Map): void;
      close(): void;
      getContent(): string | HTMLElement | null;
      getPosition(): LatLng | null | undefined;
      getZIndex(): number;
      setContent(content: string | HTMLElement): void;
      setPosition(position: LatLng | LatLngLiteral): void;
      setZIndex(zIndex: number): void;
      addListener(eventType: string, handler: Function): MapsEventListener;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
      position?: LatLng | LatLngLiteral;
      disableAutoPan?: boolean;
      maxWidth?: number;
      pixelOffset?: Size;
      zIndex?: number;
    }

    interface InfoWindowOpenOptions {
      map?: Map;
      anchor?: unknown;
      shouldFocus?: boolean;
    }

    /**
     * StreetViewPanorama
     */
    class StreetViewPanorama {
      constructor(container: Element, opts?: StreetViewPanoramaOptions);
      setPosition(latlng: LatLng | LatLngLiteral): void;
      setPov(pov: StreetViewPov): void;
      setVisible(visible: boolean): void;
      getPosition(): LatLng | null;
      getPov(): StreetViewPov | null;
      getVisible(): boolean;
    }

    interface StreetViewPanoramaOptions {
      position?: LatLng | LatLngLiteral;
      pov?: StreetViewPov;
      disableDefaultUI?: boolean;
      showRoadLabels?: boolean;
      clickToGo?: boolean;
      zoomControl?: boolean;
      panControl?: boolean;
      addressControl?: boolean;
      showRoadLabels?: boolean;
    }

    interface StreetViewPov {
      heading: number;
      pitch: number;
    }

    /**
     * Projection
     */
    interface Projection {
      fromLatLngToPoint(latLng: LatLng): Point;
      fromPointToLatLng(point: Point): LatLng;
    }

    /**
     * Controls
     */
    interface MapTypeControlOptions {
      mapTypeIds?: (string | MapTypeId)[];
      position?: ControlPosition;
      style?: MapTypeControlStyle;
    }

    enum MapTypeControlStyle {
      DEFAULT = 0,
      DROPDOWN_MENU = 1,
      HORIZONTAL_BAR = 2,
    }

    interface StreetViewControlOptions {
      position?: ControlPosition;
    }

    interface FullscreenControlOptions {
      position?: ControlPosition;
    }

    enum ControlPosition {
      TOP_LEFT = 1,
      TOP_CENTER = 2,
      TOP_RIGHT = 3,
      LEFT_TOP = 4,
      LEFT_CENTER = 5,
      LEFT_BOTTOM = 6,
      RIGHT_TOP = 7,
      RIGHT_CENTER = 8,
      RIGHT_BOTTOM = 9,
      BOTTOM_LEFT = 10,
      BOTTOM_CENTER = 11,
      BOTTOM_RIGHT = 12,
    }

    /**
     * MapTypeId
     */
    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain',
    }

    /**
     * MapTypeStyle
     */
    interface MapTypeStyle {
      elementType?: 'geometry' | 'geometry.fill' | 'geometry.stroke' | 'labels' | 'labels.icon' | 'labels.text' | 'labels.text.fill' | 'labels.text.stroke' | 'poi' | 'poi.geometry' | 'poi.geometry.fill' | 'poi.geometry.stroke' | 'poi.labels' | 'poi.labels.icon' | 'poi.labels.text' | 'poi.labels.text.fill' | 'poi.labels.text.stroke' | 'road' | 'road.geometry' | 'road.geometry.fill' | 'road.geometry.stroke' | 'road.highway' | 'road.highway.geometry' | 'road.highway.geometry.fill' | 'road.highway.geometry.stroke' | 'road.highway.label' | 'road.highway.label.icon' | 'road.highway.label.text' | 'road.highway.label.text.fill' | 'road.highway.label.text.stroke' | 'road.local' | 'road.local.geometry' | 'road.local.geometry.fill' | 'road.local.geometry.stroke' | 'road.local.label' | 'road.local.label.icon' | 'road.local.label.text' | 'road.local.label.text.fill' | 'road.local.label.text.stroke' | 'transit' | 'transit.geometry' | 'transit.geometry.fill' | 'transit.geometry.stroke' | 'transit.label' | 'transit.label.icon' | 'transit.label.text' | 'transit.label.text.fill' | 'transit.label.text.stroke' | 'water' | 'water.geometry' | 'water.geometry.fill' | 'water.geometry.stroke' | 'water.label' | 'water.label.icon' | 'water.label.text' | 'water.label.text.fill' | 'water.label.text.stroke' | 'all' | 'feature:all' | 'element:all';
      featureType?: 'all' | 'administrative' | 'administrative.country' | 'administrative.land_parcel' | 'administrative.locality' | 'administrative.neighborhood' | 'administrative.province' | 'all' | 'landscape' | 'landscape.man_made' | 'landscape.natural' | 'landscape.natural.landcover' | 'landscape.natural.terrain' | 'poi' | 'poi.attraction' | 'poi.business' | 'poi.government' | 'poi.medical' | 'poi.park' | 'poi.place_of_worship' | 'poi.school' | 'poi.sports_complex' | 'road' | 'road.arterial' | 'road.highway' | 'road.highway.controlled_access' | 'road.local' | 'road.nightlife' | 'transit' | 'transit.line' | 'transit.station' | 'transit.station.airport' | 'transit.station.bus' | 'transit.station.rail' | 'water';
      stylers?: Stylers[];
    }

    type Stylers = { color?: string; gamma?: number; hue?: string; invert_lightness?: boolean; lightness?: number; saturation?: number; visibility?: string; weight?: number };

    /**
     * Size
     */
    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      width: number;
      height: number;
      equals(other: Size): boolean;
      toString(): string;
    }

    /**
     * Point
     */
    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
      equals(other: Point): boolean;
      toString(): string;
    }

    /**
     * Padding
     */
    interface Padding {
      top: number;
      bottom: number;
      left: number;
      right: number;
    }

    /**
     * MapsEventListener
     */
    class MapsEventListener {
      remove(): void;
    }

    /**
     * MVCObject
     */
    class MVCObject {
      addListener(eventType: string, handler: Function): MapsEventListener;
      bindTo(key: string, target: MVCObject, targetKey?: string, noNotify?: boolean): void;
      get(key: string): any;
      notify(key: string): void;
      set(key: string, value: any): void;
      setValues(values?: object): void;
      unbind(key: string): void;
      unbindAll(): void;
    }
  }
}
