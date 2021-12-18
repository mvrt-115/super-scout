import {
    useColorModeValue,
    Stack,
    Heading,
    Box,
    FormControl,
    FormLabel,
    Input,
    Button,
    VStack,
    Link as StyledLink,
    Text,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    CloseButton,
} from '@chakra-ui/react';
import React, { FC, SyntheticEvent, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import firebase, { db } from '../firebase';

export interface SignupProps {}

const Signup: FC<SignupProps> = () => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [passConf, setPassConf] = useState('');
    const { signup } = useAuth();
    const [error, setError] = useState('');
    const history = useHistory();
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (pass !== passConf) {
            setError("Your password and password confirmation don't match.");
            return;
        }

        signup(email, pass)
            .then((user: firebase.auth.UserCredential) => {
                db.collection('users')
                    .doc(user.user ? user.user.uid : '')
                    .set({
                        email,
                        role: 'scout',
                        id: user.user ? user.user.uid : '',
                    });
                setLoading(false);
                history.push('/');
            })
            .catch((error: firebase.auth.AuthError) => {
                setLoading(false);
                if (error.code === 'auth/invalid-email')
                    setError('You did not enter a valid E-mail');
                else if (error.code === 'auth/weak-password')
                    setError('Your password is too weak');
                else if (error.code === 'auth/email-already-in-use')
                    setError(
                        'That E-mail address is being used by someone else',
                    );
            });
    };

    return (
        <VStack
            align={'center'}
            justify={'center'}
            bg={useColorModeValue('inherit', 'gray.800')}
        >
            {error && (
                <Stack align={'center'}>
                    <Alert
                        status="error"
                        width={'fit-content'}
                        paddingRight="10"
                        alignItems="center"
                    >
                        <AlertIcon />
                        <AlertTitle mr={2}>Failed to Sign Up!</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                        <CloseButton
                            position="absolute"
                            right="8px"
                            top="8px"
                            onClick={() => setError('')}
                        />
                    </Alert>
                </Stack>
            )}
            <Stack align={'center'} marginBottom={'3'}>
                <Heading fontSize={'4xl'}>Create your account</Heading>
            </Stack>
            <Stack align={'center'}>
                <Box
                    rounded={'lg'}
                    bg={useColorModeValue('white', 'gray.700')}
                    boxShadow={'lg'}
                    p={8}
                    minWidth="xs"
                >
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <FormControl id="email">
                                <FormLabel>Email address</FormLabel>
                                <Input
                                    required
                                    type="email"
                                    bg="inherit"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </FormControl>
                            <FormControl id="password">
                                <FormLabel>Password</FormLabel>
                                <Input
                                    required
                                    type="password"
                                    bg="inherit"
                                    onChange={(e) => setPass(e.target.value)}
                                />
                            </FormControl>
                            <FormControl id="password-conf">
                                <FormLabel>Password Conformation</FormLabel>
                                <Input
                                    type="password"
                                    bg="inherit"
                                    onChange={(e) =>
                                        setPassConf(e.target.value)
                                    }
                                />
                            </FormControl>
                            <Stack spacing={10}>
                                <Button
                                    type="submit"
                                    colorScheme="mv-purple"
                                    isLoading={loading}
                                >
                                    Sign up
                                </Button>
                            </Stack>
                            <Stack spacing={10} alignItems="center">
                                <Text>
                                    Already have an account?{' '}
                                    <StyledLink
                                        color="mv-gold"
                                        as={Link}
                                        to="/login"
                                    >
                                        Log In
                                    </StyledLink>
                                </Text>
                            </Stack>
                        </Stack>
                    </form>
                </Box>
            </Stack>
        </VStack>
    );
};

export default Signup;
