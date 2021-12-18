import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
    colors: {
        'mv-purple': {
            100: '#9969ac',
            200: '#88509e',
            300: '#773791',
            400: '#661e83',
            500: '#550575',
            600: '#4b0f6d',
            700: '#3e0a5f',
            800: '#2f064b',
            900: '#1f0136',
        },
        'mv-gold': '#ffc410',
    },
    fonts: { heading: 'Roboto', body: 'Roboto' },
});

export default theme;
