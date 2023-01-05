import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import theme from './theme';
import '@fontsource/lato/300.css';
import '@fontsource/roboto/400.css';
import Routes from './components/Routes';
import { AuthProvider } from './contexts/AuthContext';

function App() {
    return (
        <div className="App">
            <ChakraProvider theme={theme}>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes />
                    </BrowserRouter>
                </AuthProvider>
            </ChakraProvider>
        </div>
    );
}

export default App;
