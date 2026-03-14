import React, { FC } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps extends RouteProps {
    component: any;
}

const PrivateRoute: FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
    const { currentUser } = useAuth();
    
    return (
        <Route
            {...rest}
            render={props => {
                return currentUser ? <Component {...props} /> : <Redirect to="/login" />
            }}
        />
    )
}

export default PrivateRoute;
