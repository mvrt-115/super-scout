import { Route, Switch, useLocation } from 'react-router-dom';
import Dashboard from '../pages/dashboard/Dashboard';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Picklist from '../pages/Picklist';
import QRCodeGenerator from '../pages/QRCodeGenerator';
import Scanner from '../pages/Scanner';
import ScoutingInputs from '../pages/ScoutingInputs';
import Signup from '../pages/Signup';
import Navbar from './Navbar';

const Routes = () => {
    const location = useLocation();
    return (
        <>
            {location.pathname !== '/' && <Navbar />}
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/dashboard" component={Dashboard} />
                <Route exact path="/scanner" component={Scanner} />
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
                <Route exact path="/sign-up" component={Signup} />
                <Route exact path="/picklist" component={Picklist} />
            </Switch>
        </>
    );
};

export default Routes;
