import {
    Stack,
    Heading,
    Box,
    FormControl,
    FormLabel,
    Input,
    Button,
    Text,
    Link as StyledLink,
    VStack,
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    CloseButton,
    Container,
} from '@chakra-ui/react';
import React, { FC, SyntheticEvent, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export interface LoginProps {}

const Login: FC<LoginProps> = () => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');
    const history = useHistory();
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        login(email, pass)
            .then(() => {
                setLoading(false);
                history.push('/');
            })
            .catch((err: any) => {
                setLoading(false);
                const code = err?.code || '';
                if (code === 'auth/invalid-email')
                    setError('You did not enter a valid email address.');
                else if (code === 'auth/user-not-found')
                    setError('No account found with this email.');
                else if (code === 'auth/wrong-password')
                    setError('Incorrect password. Please try again.');
                else if (code === 'auth/invalid-credential')
                    setError('Invalid credentials. Please check your email and password.');
                else
                    setError('An unexpected error occurred. Please try again.');
            });
    };

    return (
        <VStack
            align={'center'}
            justify={'center'}
            minH="80vh"
            bg={'gray.50'}
            py={12}
        >
            {error && (
                <Stack align={'center'} mb={4}>
                    <Alert status="error" width={'md'} alignItems="center" borderRadius="md">
                        <AlertIcon />
                        <AlertTitle mr={2}>Error Signing In!</AlertTitle>
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
            <Container centerContent>
                <Heading fontSize={'3xl'} textAlign="center" color="mv-purple.800" mb={2}>
                    Sign in to your account
                </Heading>
                <Text color="gray.500" fontSize="sm">
                    Access scanner, QR codes, and scouting inputs
                </Text>
            </Container>
            <Stack align={'center'} mt={6}>
                <Box
                    rounded={'xl'}
                    bg={'white'}
                    boxShadow={'lg'}
                    p={8}
                    minWidth="sm"
                    border="1px solid"
                    borderColor="gray.100"
                >
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={5}>
                            <FormControl id="email">
                                <FormLabel color="gray.600">Email address</FormLabel>
                                <Input
                                    type="email"
                                    bg="gray.50"
                                    borderColor="gray.200"
                                    _focus={{ borderColor: 'mv-purple.500', boxShadow: '0 0 0 1px #4F46E5' }}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </FormControl>
                            <FormControl id="password">
                                <FormLabel color="gray.600">Password</FormLabel>
                                <Input
                                    type="password"
                                    bg="gray.50"
                                    borderColor="gray.200"
                                    _focus={{ borderColor: 'mv-purple.500', boxShadow: '0 0 0 1px #4F46E5' }}
                                    required
                                    onChange={(e) => setPass(e.target.value)}
                                />
                            </FormControl>
                            <Stack spacing={4} pt={2}>
                                <Button
                                    bg="mv-purple.500"
                                    color="white"
                                    _hover={{ bg: 'mv-purple.600' }}
                                    type={'submit'}
                                    isLoading={loading}
                                    size="lg"
                                >
                                    Sign in
                                </Button>
                            </Stack>
                            <Stack spacing={10} alignItems="center">
                                <Text fontSize="sm" color="gray.500">
                                    Don't have an account?{' '}
                                    <StyledLink
                                        color="mv-purple.500"
                                        fontWeight={600}
                                        as={Link}
                                        to="/sign-up"
                                    >
                                        Sign Up
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

export default Login;
