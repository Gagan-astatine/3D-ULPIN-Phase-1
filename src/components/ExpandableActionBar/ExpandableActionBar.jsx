import {
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import "./ExpandableActionBar.css";

const ITEM_TRANSITION = {
  type: "spring",
  stiffness: 460,
  damping: 34,
  mass: 0.62,
};

const LABEL_TRANSITION = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.7,
};

function useControllableExpanded({
  expanded,
  defaultExpanded,
  onExpandedChange,
}) {
  const [internalExpanded, setInternalExpanded] = useState(
    defaultExpanded ?? false,
  );

  const isControlled = expanded !== undefined;
  const value = expanded ?? internalExpanded;

  const setValue = useCallback(
    (next) => {
      if (!isControlled) setInternalExpanded(next);
      onExpandedChange?.(next);
    },
    [isControlled, onExpandedChange],
  );

  return [value, setValue];
}

export function ExpandableActionBar({
  items,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  activeId,
  onAction,
  expandOnHover = true,
  expandOnFocus = true,
  collapseDelay = 90,
  className = "",
}) {
  const reduce = useReducedMotion();
  const layoutId = useId();

  const [isExpanded, setIsExpanded] = useControllableExpanded({
    expanded,
    defaultExpanded,
    onExpandedChange,
  });

  const [hoveredId, setHoveredId] = useState(null);
  const collapseTimer = useRef(null);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
  }, []);

  const open = useCallback(() => {
    clearCollapseTimer();
    setIsExpanded(true);
  }, [clearCollapseTimer, setIsExpanded]);

  const close = useCallback(() => {
    clearCollapseTimer();

    const timer = window.setTimeout(() => {
      setIsExpanded(false);
      setHoveredId(null);
    }, collapseDelay);

    collapseTimer.current = timer;
  }, [clearCollapseTimer, collapseDelay, setIsExpanded]);

  useEffect(() => clearCollapseTimer, [clearCollapseTimer]);

  const onRootMouseEnter = () => {
    if (expandOnHover) open();
  };

  const onRootMouseLeave = () => {
    setHoveredId(null);
    if (expandOnHover) close();
  };

  const onRootFocus = () => {
    if (expandOnFocus) open();
  };

  const onRootBlur = (event) => {
    if (
      !event.currentTarget.contains(event.relatedTarget) &&
      expandOnFocus
    ) {
      close();
    }
  };

  const activeItemId = activeId ?? items.find((item) => item.active)?.id;
  const highlightId = hoveredId ?? activeItemId;

  return (
    <LayoutGroup id={layoutId}>
      <motion.div
        layout="size"
        onMouseEnter={onRootMouseEnter}
        onMouseLeave={onRootMouseLeave}
        onFocus={onRootFocus}
        onBlur={onRootBlur}
        transition={ITEM_TRANSITION}
        className={`expandable-action-bar-root ${className}`}
      >
        <motion.div
          layout="size"
          transition={ITEM_TRANSITION}
          className="expandable-action-bar-track"
        >
          {items.map((item) => {
            const isActive = item.active || activeId === item.id;
            const isHighlighted = highlightId === item.id;

            return (
              <motion.button
                key={item.id}
                layout="position"
                type="button"
                disabled={item.disabled}
                title={typeof item.label === "string" ? item.label : undefined}
                onMouseEnter={() => {
                  clearCollapseTimer();
                  setHoveredId(item.id);
                }}
                onClick={(event) => {
                  event.currentTarget.blur();
                  item.onClick?.();
                  onAction?.(item);
                }}
                whileTap={reduce || item.disabled ? undefined : { scale: 0.96 }}
                transition={ITEM_TRANSITION}
                className={`expandable-action-bar-item ${isHighlighted ? "highlighted" : ""} ${isActive ? "active" : ""}`}
              >
                {isHighlighted ? (
                  <motion.span
                    layoutId="action-bar-highlight"
                    transition={ITEM_TRANSITION}
                    className="expandable-action-bar-highlight"
                  />
                ) : null}

                <span className="expandable-action-bar-icon">
                  {item.icon}
                </span>

                <motion.span
                  aria-hidden={!isExpanded}
                  animate={
                    reduce
                      ? {
                          width: isExpanded ? "auto" : 0,
                          opacity: isExpanded ? 1 : 0,
                          marginLeft: isExpanded ? 8 : 0,
                          x: 0,
                          filter: "blur(0px)",
                        }
                      : {
                          width: isExpanded ? "auto" : 0,
                          opacity: isExpanded ? 1 : 0,
                          x: isExpanded ? 0 : -4,
                          marginLeft: isExpanded ? 8 : 0,
                          filter: isExpanded ? "blur(0px)" : "blur(3px)",
                        }
                  }
                  transition={reduce ? { duration: 0 } : LABEL_TRANSITION}
                  className="expandable-action-bar-label"
                >
                  {item.label}
                </motion.span>

                {item.shortcut ? (
                  <motion.span
                    aria-hidden={!isExpanded}
                    animate={{
                      width: isExpanded ? "auto" : 0,
                      opacity: isExpanded ? 1 : 0,
                      marginLeft: isExpanded ? 4 : 0,
                    }}
                    transition={LABEL_TRANSITION}
                    className="expandable-action-bar-shortcut"
                  >
                    {item.shortcut}
                  </motion.span>
                ) : null}

                {item.badge ? (
                  <span
                    className={`expandable-action-bar-badge ${!isExpanded ? "collapsed" : ""}`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </LayoutGroup>
  );
}

export function useExpandableActionBar(items) {
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState(items[0]?.id);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId),
    [activeId, items],
  );

  return useMemo(
    () => ({
      expanded,
      setExpanded,
      activeId,
      setActiveId,
      activeItem,
    }),
    [activeId, activeItem, expanded],
  );
}
