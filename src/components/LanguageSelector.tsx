import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../i18n/translations';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const handleChange = (_: React.MouseEvent<HTMLElement>, newLang: Language | null) => {
    if (newLang) {
      setLanguage(newLang);
    }
  };

  return (
    <Box sx={{ 
      position: 'absolute', 
      top: 16, 
      right: 16,
      zIndex: 1000,
      backgroundColor: 'background.paper',
      borderRadius: 1,
      boxShadow: 1,
      p: 0.5
    }}>
      <ToggleButtonGroup
        value={language}
        exclusive
        onChange={handleChange}
        aria-label="language selector"
        size="small"
      >
        <ToggleButton 
          value="en" 
          aria-label="english"
          sx={{ 
            px: 1,
            minWidth: '40px',
            fontWeight: language === 'en' ? 600 : 400
          }}
        >
          EN
        </ToggleButton>
        <ToggleButton 
          value="ru" 
          aria-label="russian"
          sx={{ 
            px: 1,
            minWidth: '40px',
            fontWeight: language === 'ru' ? 600 : 400
          }}
        >
          RU
        </ToggleButton>
        <ToggleButton 
          value="uz" 
          aria-label="uzbek"
          sx={{ 
            px: 1,
            minWidth: '40px',
            fontWeight: language === 'uz' ? 600 : 400
          }}
        >
          UZ
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default LanguageSelector; 