import { extendTheme } from '@chakra-ui/react';
import Fonts from './Fonts';

const theme = extendTheme({
    colors: {
        'mv-purple': {
            100: '#E0E7FF',
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#818CF8',
            500: '#4F46E5', // Primary Modern Indigo
            600: '#4338CA',
            700: '#3730A3',
            800: '#312E81',
            900: '#1E1B4B',
            1000: '#141233',
        },
        'mv-gold': '#FBBF24',
    },
    fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif', title: 'Pirulen' },
});

export default theme;
