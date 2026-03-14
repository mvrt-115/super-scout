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
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Text,
    Button,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
        label: 'QR Codes & Scanner',
    },
    {
        href: '/scouting-inputs',
        label: 'Scouting Inputs',
    },
];

const NavLink = ({ children, href }: { children: ReactNode; href: string }) => (
    <StyledLink
        px={3}
        py={1}
        rounded={'md'}
        fontWeight={500}
        fontSize={'sm'}
        _hover={{
            textDecoration: 'none',
            bg: 'whiteAlpha.200',
        }}
        as={Link}
        to={href}
    >
        {children}
    </StyledLink>
);

export default function Navbar() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { currentUser, logout, loggedIn } = useAuth();
    const history = useHistory();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            history.push('/');
        } catch {
            console.error('Failed to log out');
        }
    };

    return (
        <>
            <Box
                bg={'mv-purple.800'}
                px={4}
                color={'white'}
                borderBottom="1px solid"
                borderColor="whiteAlpha.100"
            >
                <Flex
                    h={14}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                >
                    <IconButton
                        size={'sm'}
                        icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                        aria-label={'Open Menu'}
                        display={{ md: 'none' }}
                        onClick={isOpen ? onClose : onOpen}
                        variant="ghost"
                        color="white"
                        _hover={{ bg: 'whiteAlpha.200' }}
                    />
                    <Box as={Link} to="/">
                        <Heading size="sm" letterSpacing="tight">
                            MVRT Super Scout
                        </Heading>
                    </Box>
                    <HStack
                        as={'nav'}
                        spacing={1}
                        display={{ base: 'none', md: 'flex' }}
                    >
                        {Links.map((link, index) => (
                            <NavLink key={index} href={link.href}>
                                {link.label}
                            </NavLink>
                        ))}
                    </HStack>

                    {/* Profile Avatar / Login removed for now */}
                    <HStack spacing={3}>
                    </HStack>
                </Flex>

                <Collapse in={isOpen} animateOpacity>
                    <Box pb={4} display={{ md: 'none' }}>
                        <Stack as={'nav'} spacing={2}>
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
