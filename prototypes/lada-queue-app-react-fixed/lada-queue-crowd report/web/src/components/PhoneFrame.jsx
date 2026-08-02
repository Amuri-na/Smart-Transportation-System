import React from 'react';

// Wraps every screen in a phone-shaped box on wide (desktop browser)
// windows — see the @media rule in styles.css. On an actual phone,
// this has no visible effect since the screen is already narrow.
export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame-outer">
      <div className="phone-frame-inner">{children}</div>
    </div>
  );
}
