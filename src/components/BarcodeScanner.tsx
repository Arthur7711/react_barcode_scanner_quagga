import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import Quagga from 'quagga';
import { useLanguage } from '../contexts/LanguageContext';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onError: (error: string) => void;
}

export const BarcodeScanner = ({ onDetected, onError }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!videoRef.current) return;

    const config = {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoRef.current,
        constraints: {
          facingMode: "environment"
        }
      },
      decoder: {
        readers: [
          "ean_reader",
          "ean_8_reader",
          "upc_reader",
          "upc_e_reader",
          "code_128_reader"
        ]
      }
    };

    let mounted = true;

    Quagga.init(config, (err) => {
      if (err || !mounted) {
        console.error('Scanner initialization error:', err);
        onError('Camera initialization failed');
        return;
      }
      Quagga.start();
    });

    let lastCode = '';
    let lastTime = 0;

    Quagga.onDetected((result) => {
      if (!mounted) return;
      const code = result.codeResult.code;
      const now = Date.now();
      
      if (code === lastCode && now - lastTime < 1000) {
        Quagga.stop();
        onDetected(code);
      }
      
      lastCode = code;
      lastTime = now;
    });

    return () => {
      mounted = false;
      Quagga.stop();
    };
  }, [onDetected, onError]);

  return (
    <Box sx={{ 
      width: '100%',
      height: '300px',
      backgroundColor: '#000',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 1
    }}>
      <div id="interactive" className="viewport" ref={videoRef} />
      <Typography
        sx={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          bgcolor: 'rgba(0,0,0,0.5)',
          px: 2,
          py: 1,
          borderRadius: 1,
          zIndex: 10
        }}
      >
        {t('scanner.centerBarcode')}
      </Typography>
    </Box>
  );
}; 