import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import DesignCanvas from "@/components/DesignCanvas";
import { PanelControlsFloating, PanelControlsContent } from "@/components/PanelControlsFloating";
import { ContentPanel, ContentPanelContent } from "@/components/ContentPanel";
import { ExpandedComponentLibrary } from "@/components/ExpandedComponentLibrary";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";
import { DesignCanvasProvider, useDesignCanvas } from "@/contexts/DesignCanvasContext";
import { DockZones } from "@/components/DockZones";
import { PanelManagerProvider } from "@/components/PanelManager";
import { FloatingPanelCoordinatorProvider } from "@/contexts/FloatingPanelCoordinator";

const MIN_PANEL_SIZE  = 150;
const MIN_CANVAS_SIZE = 120;
const MAX_PANEL_FRAC  = 0.75; // panel can never exceed 75% of viewport dimension

interface ResizeDividerProps {
  direction: "vertical" | "horizontal";
  onDragStart: (startPx: number) => void;
  onDrag: (deltaPx: number) => void;
  onDragEnd: () => void;
}

function ResizeDivider({ direction, onDragStart, onDrag, onDragEnd }: ResizeDividerProps) {
  const [active, setActive] = useState(false);
  const startRef = useRef(0);
  const isVert = direction === "vertical";

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const start = isVert ? e.clientX : e.clientY;
    startRef.current = start;
    setActive(true);
    onDragStart(start);

    const onMove = (ev: MouseEvent) => {
      const current = isVert ? ev.clientX : ev.clientY;
      onDrag(current - startRef.current);
    };
    const onUp = () => {
      setActive(false);
      onDragEnd();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [isVert, onDragStart, onDrag, onDragEnd]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={[
        "flex-shrink-0 relative group transition-colors select-none",
        isVert
          ? "w-[5px] cursor-col-resize hover:bg-primary/30 active:bg-primary/50"
          : "h-[5px] cursor-row-resize hover:bg-primary/30 active:bg-primary/50",
        active ? (isVert ? "bg-primary/50 w-[5px]" : "bg-primary/50 h-[5px]") : "bg-technical-200/60 dark:bg-technical-600/60",
      ].join(" ")}
    >
      <div className={[
        "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
      ].join(" ")}>
        {isVert ? (
          <div className="flex flex-col gap-[3px]">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="w-[2px] h-[2px] rounded-full bg-primary/70" />
            ))}
          </div>
        ) : (
          <div className="flex gap-[3px]">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="h-[2px] w-[2px] rounded-full bg-primary/70" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfiguratorContent() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation">("configuration");
  const { setActiveDockZone, dockedPanels, undockPanel, isDraggingPanel } = useDesignCanvas();

  const topPanel    = dockedPanels.find(p => p.position === "top");
  const bottomPanel = dockedPanels.find(p => p.position === "bottom");
  const leftPanel   = dockedPanels.find(p => p.position === "left");
  const rightPanel  = dockedPanels.find(p => p.position === "right");

  // Local resize state — initialised from docked panel sizes, clamped to fit viewport
  const clampedLeft  = Math.min(leftPanel?.size  ?? 0, window.innerWidth  * MAX_PANEL_FRAC);
  const clampedRight = Math.min(rightPanel?.size ?? 0, window.innerWidth  * MAX_PANEL_FRAC);
  const clampedTop   = Math.min(topPanel?.size   ?? 0, window.innerHeight * MAX_PANEL_FRAC);
  const clampedBot   = Math.min(bottomPanel?.size ?? 0, window.innerHeight * MAX_PANEL_FRAC);

  const [leftWidth,   setLeftWidth]   = useState(clampedLeft);
  const [rightWidth,  setRightWidth]  = useState(clampedRight);
  const [topHeight,   setTopHeight]   = useState(clampedTop);
  const [bottomHeight,setBottomHeight]= useState(clampedBot);

  // Sync when panels are docked/undocked
  useEffect(() => { if (leftPanel)   setLeftWidth(w  => w  || leftPanel.size);   }, [leftPanel?.id]);
  useEffect(() => { if (rightPanel)  setRightWidth(w => w  || rightPanel.size);  }, [rightPanel?.id]);
  useEffect(() => { if (topPanel)    setTopHeight(h  => h  || topPanel.size);    }, [topPanel?.id]);
  useEffect(() => { if (bottomPanel) setBottomHeight(h => h || bottomPanel.size);}, [bottomPanel?.id]);

  // Snapshot sizes at drag start so delta is relative to that
  const snapLeft   = useRef(leftWidth);
  const snapRight  = useRef(rightWidth);
  const snapTop    = useRef(topHeight);
  const snapBot    = useRef(bottomHeight);

  // Left divider drag
  const onLeftDragStart  = useCallback(() => { snapLeft.current = leftWidth; }, [leftWidth]);
  const onLeftDrag       = useCallback((delta: number) => {
    const maxLeft = window.innerWidth - (rightPanel ? rightWidth : 0) - MIN_CANVAS_SIZE;
    setLeftWidth(Math.max(MIN_PANEL_SIZE, Math.min(snapLeft.current + delta, maxLeft)));
  }, [rightPanel, rightWidth]);

  // Right divider drag (delta is reversed: dragging left shrinks right panel)
  const onRightDragStart = useCallback(() => { snapRight.current = rightWidth; }, [rightWidth]);
  const onRightDrag      = useCallback((delta: number) => {
    const maxRight = window.innerWidth - (leftPanel ? leftWidth : 0) - MIN_CANVAS_SIZE;
    setRightWidth(Math.max(MIN_PANEL_SIZE, Math.min(snapRight.current - delta, maxRight)));
  }, [leftPanel, leftWidth]);

  // Top divider drag
  const onTopDragStart   = useCallback(() => { snapTop.current = topHeight; }, [topHeight]);
  const onTopDrag        = useCallback((delta: number) => {
    const maxTop = window.innerHeight - (bottomPanel ? bottomHeight : 0) - MIN_CANVAS_SIZE;
    setTopHeight(Math.max(MIN_PANEL_SIZE, Math.min(snapTop.current + delta, maxTop)));
  }, [bottomPanel, bottomHeight]);

  // Bottom divider drag
  const onBotDragStart   = useCallback(() => { snapBot.current = bottomHeight; }, [bottomHeight]);
  const onBotDrag        = useCallback((delta: number) => {
    const maxBot = window.innerHeight - (topPanel ? topHeight : 0) - MIN_CANVAS_SIZE;
    setBottomHeight(Math.max(MIN_PANEL_SIZE, Math.min(snapBot.current - delta, maxBot)));
  }, [topPanel, topHeight]);

  const noop = useCallback(() => {}, []);

  const handleDockZoneHover = (zone: "top" | "bottom" | "left" | "right" | null) => {
    setActiveDockZone(zone);
  };

  const renderPanelContent = (panelId: string) => {
    switch (panelId) {
      case "all-features-panel":
        return (
          <PanelControlsContent
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as "configuration" | "visual" | "documentation")}
          />
        );
      case "content-panel":
        return <ContentPanelContent activeTab={activeTab} />;
      case "component-library-panel":
        return <ExpandedComponentLibrary />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            This panel cannot be displayed while docked. Please undock it to view.
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-technical-50 dark:bg-technical-900 text-technical-900 dark:text-technical-50 overflow-hidden">
      <Header />
      <DockZones isDragging={isDraggingPanel} onDockZoneHover={handleDockZoneHover} />
      <PanelControlsFloating
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as "configuration" | "visual" | "documentation")}
      />
      <ContentPanel activeTab={activeTab} />

      <div className="flex-1 overflow-hidden bg-gradient-to-br from-technical-50 to-technical-100 dark:from-technical-900 dark:to-technical-800 flex flex-col">

        {/* ── Top docked panel ── */}
        {topPanel && (
          <>
            <div
              className="border-b border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-[5] flex flex-col"
              style={{ height: topHeight, minHeight: topHeight }}
              data-testid="docked-panel-top"
            >
              <div className="p-3 flex items-center gap-2 border-b border-technical-200 dark:border-technical-600 shrink-0">
                <h3 className="font-semibold text-sm">{topPanel.title}</h3>
                <button
                  onClick={() => undockPanel(topPanel.id)}
                  className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                  data-testid="undock-button-top"
                >
                  Undock
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto w-full">{renderPanelContent(topPanel.id)}</div>
            </div>
            <ResizeDivider
              direction="horizontal"
              onDragStart={onTopDragStart}
              onDrag={onTopDrag}
              onDragEnd={noop}
            />
          </>
        )}

        {/* ── Middle row ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* Left docked panel */}
          {leftPanel && (
            <>
              <div
                className="border-r border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-10 flex flex-col"
                style={{ width: leftWidth, minWidth: leftWidth, flexShrink: 0 }}
                data-testid="docked-panel-left"
              >
                <div className="p-3 flex flex-col items-center gap-2 border-b border-technical-200 dark:border-technical-600 shrink-0">
                  <h3 className="font-semibold text-sm text-center">{leftPanel.title}</h3>
                  <button
                    onClick={() => undockPanel(leftPanel.id)}
                    className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                    data-testid="undock-button-left"
                  >
                    Undock
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-auto h-full">{renderPanelContent(leftPanel.id)}</div>
              </div>
              <ResizeDivider
                direction="vertical"
                onDragStart={onLeftDragStart}
                onDrag={onLeftDrag}
                onDragEnd={noop}
              />
            </>
          )}

          {/* Design Canvas */}
          <div className="flex-1 p-6 relative z-0 min-w-0">
            <div className="h-full w-full rounded-xl border border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 shadow-lg overflow-hidden">
              <DesignCanvas />
            </div>
          </div>

          {/* Right docked panel */}
          {rightPanel && (
            <>
              <ResizeDivider
                direction="vertical"
                onDragStart={onRightDragStart}
                onDrag={onRightDrag}
                onDragEnd={noop}
              />
              <div
                className="border-l border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-10 flex flex-col"
                style={{ width: rightWidth, minWidth: rightWidth, flexShrink: 0 }}
                data-testid="docked-panel-right"
              >
                <div className="p-3 flex flex-col items-center gap-2 border-b border-technical-200 dark:border-technical-600 shrink-0">
                  <h3 className="font-semibold text-sm text-center">{rightPanel.title}</h3>
                  <button
                    onClick={() => undockPanel(rightPanel.id)}
                    className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                    data-testid="undock-button-right"
                  >
                    Undock
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-auto h-full">{renderPanelContent(rightPanel.id)}</div>
              </div>
            </>
          )}
        </div>

        {/* ── Bottom docked panel ── */}
        {bottomPanel && (
          <>
            <ResizeDivider
              direction="horizontal"
              onDragStart={onBotDragStart}
              onDrag={onBotDrag}
              onDragEnd={noop}
            />
            <div
              className="border-t border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-[5] flex flex-col"
              style={{ height: bottomHeight, minHeight: bottomHeight }}
              data-testid="docked-panel-bottom"
            >
              <div className="p-3 flex items-center gap-2 border-b border-technical-200 dark:border-technical-600 shrink-0">
                <h3 className="font-semibold text-sm">{bottomPanel.title}</h3>
                <button
                  onClick={() => undockPanel(bottomPanel.id)}
                  className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                  data-testid="undock-button-bottom"
                >
                  Undock
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto w-full">{renderPanelContent(bottomPanel.id)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Configurator() {
  return (
    <ConfigurationProvider>
      <DesignCanvasProvider>
        <FloatingPanelCoordinatorProvider>
          <PanelManagerProvider>
            <ConfiguratorContent />
          </PanelManagerProvider>
        </FloatingPanelCoordinatorProvider>
      </DesignCanvasProvider>
    </ConfigurationProvider>
  );
}
