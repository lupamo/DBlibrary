import { useState, useEffect, useRef } from 'react';

function Collapsible({ open, children}) {
  const innerRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (!innerRef.current) return;
    if (open) {
      setMaxHeight(innerRef.current.scrollHeight);
    } else {
      setMaxHeight(0);
    }
  }, [open, children]);

  return (
    <div
	  style={{
		maxHeight,
		overflow: 'hidden',
		transition: 'max-height 0.3s ease',
	  }}
	>
		<div ref={innerRef}>{children}</div>
	</div>
  )
}

export default Collapsible;