import React, { useEffect } from 'react';

const AdBanner = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error", e);
    }
  }, []);

  return (
    <ins className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-2651043074081875"
      data-ad-slot="7806373976"
      data-ad-format="auto"
      data-full-width-responsive="true">
    </ins>
  );
};

export default AdBanner;