import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Navbar from './components/Navbar';
import theme from './theme';
import '@fontsource/lato/300.css';
import '@fontsource/roboto/400.css';
import Home from './pages/Home';
import QRCodeGenerator from './pages/QRCodeGenerator';
import Scanner from './pages/Scanner';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Picklist from './pages/Picklist';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/dashboard/Dashboard';
import ScoutingInputs from './pages/ScoutingInputs';

function App() {
    return (
        <div className="App">
            <ChakraProvider theme={theme}>
                <AuthProvider>
                    <BrowserRouter>
                        <Navbar />
                        <div
                            style={{
                                marginTop: '3vh',
                                justifyContent: 'center',
                            }}
                        >
                            <Switch>
                                <Route exact path="/" component={Home} />
                                <Route path="/dashboard">
                                    <Dashboard />
                                </Route>
                                <Route
                                    exact
                                    path="/scanner"
                                    component={Scanner}
                                />
                                <Route
                                    exact
                                    path="/scouting-inputs"
                                    component={ScoutingInputs}
                                />
                                <Route
                                    exact
                                    path="/qr-code-generator"
                                    component={QRCodeGenerator}
                                />
                                <Route exact path="/login" component={Login} />
                                <Route
                                    exact
                                    path="/sign-up"
                                    component={Signup}
                                />
                                <Route
                                    exact
                                    path="/picklist"
                                    component={Picklist}
                                />
                            </Switch>
                        </div>
                    </BrowserRouter>
                </AuthProvider>
            </ChakraProvider>
        </div>
    );
}

export default App;
