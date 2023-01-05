import { ReactNode, useEffect, useState } from 'react';
import {
    Box,
    Flex,
    HStack,
    Link as StyledLink,
    IconButton,
    useDisclosure,
    Stack,
    Heading,
    Collapse,
    Avatar,
    Icon,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Spacer,
    Text,
    Button,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IoExitOutline } from 'react-icons/io5';

interface LinkType {
    href: string;
    label: string;
}

const Links: LinkType[] = [
    {
        href: '/dashboard',
        label: 'Dashboard',
    },
    {
        href: '/scanner',
        label: 'Scanner',
    },
    {
        href: '/qr-code-generator',
        label: 'Match QR Code',
    },
    {
        href: '/scouting-inputs',
        label: 'Scouting Inputs',
    },
    {
        href: '/picklist',
        label: 'Picklist',
    },
];

const NavLink = ({ children, href }: { children: ReactNode; href: string }) => (
    <StyledLink
        px={2}
        py={1}
        rounded={'md'}
        _hover={{
            textDecoration: 'none',
            // backgroundColor: '#dab0ec',
            fontSize: '110%',
        }}
        as={Link}
        to={href}
    >
        {children}
    </StyledLink>
);

const ProfileButton = () => {
    const { logout } = useAuth();
    return (
        <Menu>
            <MenuButton as={Avatar} backgroundColor="mv-purple.500" />
            <MenuList>
                <MenuItem onClick={logout}>
                    <Flex
                        width="inherit"
                        justifyContent="center"
                        alignItems="center"
                        color={'black'}
                    >
                        <Text>Log Out</Text>
                        <Spacer />
                        <Icon as={IoExitOutline} height="100%" />
                    </Flex>
                </MenuItem>
            </MenuList>
        </Menu>
    );
};

const AuthButtons = () => {
    const history = useHistory();
    return (
        <>
            <Button
                variant={'outline'}
                _hover={{
                    backgroundColor: '#765d80',
                }}
                onClick={() => history.push('/login')}
            >
                Log In
            </Button>
            <Button
                variant={'solid'}
                colorScheme="purple"
                onClick={() => history.push('/sign-up')}
            >
                Sign Up
            </Button>
        </>
    );
};

export default function Navbar() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { currentUser, logout } = useAuth();
    const [bg, setBg] = useState<string>('#550575');
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === '/') setBg('');
        else setBg('#550575');
    }, [location]);

    return (
        <>
            <Box bg={bg} px={4} color={'white'}>
                <Flex
                    h={16}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                >
                    <IconButton
                        size={'md'}
                        icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                        aria-label={'Open Menu'}
                        display={{ md: 'none' }}
                        onClick={isOpen ? onClose : onOpen}
                        bg={'transpernt'}
                    />
                    <Box as={Link} to="/">
                        <Heading size="md">MVRT Super Scout</Heading>
                    </Box>
                    <HStack
                        as={'nav'}
                        spacing={4}
                        display={{ base: 'none', md: 'flex' }}
                    >
                        {Links.map((link, index) => (
                            <NavLink key={index} href={link.href}>
                                {link.label}
                            </NavLink>
                        ))}
                    </HStack>
                    <HStack>
                        {currentUser ? <ProfileButton /> : <AuthButtons />}
                    </HStack>
                </Flex>

                <Collapse in={isOpen} animateOpacity>
                    <Box pb={4} display={{ md: 'none' }}>
                        <Stack as={'nav'} spacing={4}>
                            {Links.map((link, index) => (
                                <NavLink key={index} href={link.href}>
                                    {link.label}
                                </NavLink>
                            ))}
                        </Stack>
                    </Box>
                </Collapse>
            </Box>
        </>
    );
}
