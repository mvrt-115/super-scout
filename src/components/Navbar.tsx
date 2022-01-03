import { ReactNode } from 'react';
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
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
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
];

const NavLink = ({ children, href }: { children: ReactNode; href: string }) => (
    <StyledLink
        px={2}
        py={1}
        rounded={'md'}
        _hover={{
            textDecoration: 'none',
        }}
        as={Link}
        to={href}
    >
        {children}
    </StyledLink>
);

export default function Navbar() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { currentUser, logout } = useAuth();

    return (
        <>
            <Box bg={'mv-purple.500'} px={4} color={'white'}>
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
                    <HStack spacing={8} alignItems={'center'}>
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
                    </HStack>
                    <HStack>
                        {currentUser ? (
                            <Menu>
                                <MenuButton
                                    as={Avatar}
                                    backgroundColor="mv-purple.500"
                                />
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
                                            <Icon
                                                as={IoExitOutline}
                                                height="100%"
                                            />
                                        </Flex>
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                        ) : (
                            <>
                                <NavLink href="/login">Login</NavLink>
                                <NavLink href="/sign-up">Signup</NavLink>
                            </>
                        )}
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
