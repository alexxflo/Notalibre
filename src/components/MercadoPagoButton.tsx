'use client';
import { useEffect, useRef } from 'react';

interface MercadoPagoButtonProps {
  preferenceId: string;
}

const MercadoPagoButton = ({ preferenceId }: MercadoPagoButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      const script = document.createElement('script');
      script.src = "https://www.mercadopago.com.mx/integrations/v1/web-payment-checkout.js";
      script.setAttribute('data-preference-id', preferenceId);
      script.setAttribute('data-source', 'button');
      
      // Clear previous buttons before appending a new one to avoid duplicates on re-render
      buttonRef.current.innerHTML = '';
      buttonRef.current.appendChild(script);
    }
  }, [preferenceId]);

  return <div ref={buttonRef} className="flex justify-center my-4"></div>;
};

export default MercadoPagoButton;
