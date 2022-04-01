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

export default function Card({
    title,
    info,
    subinfo,
}: {
    title: string;
    info: string;
    subinfo?: string;
}) {
    return (
        <Center py={6}>
            <Box
                bg={useColorModeValue('white', 'gray.900')}
                boxShadow={'2xl'}
                rounded={'lg'}
                p={6}
                textAlign={'center'}
            >
                <Heading fontSize={'2xl'} fontFamily={'body'}>
                    {title}
                </Heading>
                <Text
                    textAlign={'center'}
                    color={useColorModeValue('gray.700', 'gray.400')}
                    px={3}
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
