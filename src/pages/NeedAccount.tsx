import { Container, Heading, Text } from '@chakra-ui/react';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as Profile } from '../assets/NeedAccount.svg';

interface NeedAccountProps {}

const NeedAccount: FC<NeedAccountProps> = () => {
    return (
        <Container
            centerContent
            width={{
                base: 'xs',
                md: 'sm',
                lg: 'md',
            }}
        >
            <Heading>Please Log In</Heading>
            <Profile
                style={{ marginTop: '3vh', width: '45vh', height: '25vh' }}
            />
            <Text marginTop="3vh" textAlign="center" fontSize="xl">
                Uploading or modifying data requires an account. Please click
                this link to{' '}
                <Text
                    color="mv-purple.300"
                    as={Link}
                    to="/login"
                    textDecoration="underline"
                >
                    log in
                </Text>{' '}
                or this link to{' '}
                <Text
                    color="mv-purple.300"
                    as={Link}
                    to="/signup"
                    textDecoration="underline"
                >
                    create an account
                </Text>
                .
            </Text>
        </Container>
    );
};

export default NeedAccount;
