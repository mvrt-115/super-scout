import {
    Heading,
    Avatar,
    Box,
    Center,
    Text,
    Stack,
    Button,
    Link,
    Badge,
    useColorModeValue,
} from '@chakra-ui/react';

import theme from '../theme';

export default function Card({
    title,
    info,
    colorTheme,
    subinfo,
    height,
    width,
}: {
    title: string;
    info: any;
    colorTheme?: number; // use only numbers 1 (gold), 100, 200, 300, ... 1000
    subinfo?: string;
    height?: string;
    width?: string;
}) {
    let themeColor = colorTheme
        ? colorTheme === 1
            ? theme.colors['mv-gold']
            : theme.colors['mv-purple'][colorTheme]
        : '';
    return (
        <Center py={6}>
            <Box
                borderWidth={colorTheme ? 2 : 0}
                borderColor={colorTheme ? themeColor : ''}
                bg={useColorModeValue('white', 'gray.900')}
                boxShadow={'2xl'}
                rounded={'lg'}
                p={6}
                textAlign={'center'}
                maxWidth="150px"
                height={height}
                width={width}
            >
                <Heading
                    fontSize={'md'}
                    fontFamily={'body'}
                    color={colorTheme ? themeColor : '#1A202C'}
                >
                    {title}
                </Heading>
                <Text
                    textAlign={'center'}
                    color={useColorModeValue(
                        colorTheme ? themeColor : 'gray.700',
                        'gray.400',
                    )}
                    px={3}
                    fontSize={'sm'}
                >
                    {info}
                </Text>
                <Text fontSize={'sm'} color={'gray.500'}>
                    {subinfo}
                </Text>
            </Box>
        </Center>
    );
}
