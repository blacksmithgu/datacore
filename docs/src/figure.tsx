import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

export function CodeExample({ children, explanation }) {
    return (
        <div style={{ border: '1px solid #888', padding: "10px 8px 0px 8px", margin: "10px 0px 10px 0px" }}>
            <figcaption style={{ paddingLeft: "4px", paddingBottom: "12px" }}><b>{explanation}</b></figcaption>
            {children}
        </div>
    );
}

export function ImageFigure({ src, caption }) {
  return (
    <figure style={{ border: '1px solid #888', padding: 20 }}>
      <img src={useBaseUrl(src)} alt={caption} />
      <figcaption>Figure: <i>{caption}</i></figcaption>
    </figure>
  )
}