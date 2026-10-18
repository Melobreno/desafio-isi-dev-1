import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

export interface DropdownMenuItem {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  dividerBefore?: boolean;
}

interface DropdownMenuProps {
  header?: string;
  items: DropdownMenuItem[];
  ariaLabel?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  header,
  items,
  ariaLabel = 'Ações da linha',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  }>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const estimatedMenuHeight = 250;

    const rightOffset = Math.max(8, viewportWidth - rect.right);
    if (
      rect.bottom + estimatedMenuHeight > viewportHeight &&
      rect.top > estimatedMenuHeight
    ) {
      setCoords({
        bottom: viewportHeight - rect.top + 4,
        right: rightOffset,
      });
    } else {
      setCoords({
        top: rect.bottom + 4,
        right: rightOffset,
      });
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  return (
    <div className="dropdown-container" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className={`btn btn-ghost btn-icon ${open ? 'active' : ''}`}
        onClick={() => {
          if (!open) {
            updatePosition();
          }
          setOpen((prev) => !prev);
        }}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu-portal"
            role="menu"
            style={{
              position: 'fixed',
              top: coords.top,
              bottom: coords.bottom,
              right: coords.right,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {header && <div className="dropdown-menu-header">{header}</div>}
            {items.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.dividerBefore && <div className="dropdown-divider" />}
                <button
                  type="button"
                  role="menuitem"
                  className={`dropdown-item ${item.destructive ? 'destructive' : ''}`.trim()}
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                >
                  <div className="dropdown-item-main">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.description && (
                    <div className="dropdown-item-desc">{item.description}</div>
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};
