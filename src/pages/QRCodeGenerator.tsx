import {
    Box,
    useColorModeValue,
    VStack,
    FormControl,
    FormLabel,
    InputGroup,
    InputLeftElement,
    Input,
    Button,
    Heading,
    Select,
    Icon,
    HStack,
} from '@chakra-ui/react';
import { ImEarth } from 'react-icons/im';
import { AiOutlineFieldNumber } from 'react-icons/ai';
import { BsFillShieldFill } from 'react-icons/bs';
import React, { FC, SyntheticEvent, useEffect, useState } from 'react';
import { db } from '../firebase';
import QRCode from 'react-qr-code';

interface QRCodeGeneratorProps {}

const QRCodeGenerator: FC<QRCodeGeneratorProps> = () => {
    const year = new Date().getFullYear();
    const [regionals, setRegionals] = useState<string[]>([]);
    const [qrcode, setQRCode] = useState<string>();
    const [regional, setRegional] = useState<string>('');
    const [alliance, setAlliance] = useState<string>('');
    const [matchNum, setMatchNum] = useState<string | number>('');
    const [team1, setTeam1] = useState<string | number>('');
    const [team2, setTeam2] = useState<string | number>('');
    const [team3, setTeam3] = useState<string | number>('');

    useEffect(() => {
        const fetchData = async () => {
            const res = await db
                .collection('years')
                .doc(`${year}`)
                .collection('regionals')
                .get();
            setRegionals(res.docs.map((doc) => doc.id));
        };
        fetchData();
    }, [year]);

    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();

        setQRCode(
            `${matchNum}@${regional}:${alliance}[${team1},${team2},${team3}]`,
        );
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box
                bg={useColorModeValue('white', 'gray.700')}
                borderRadius="lg"
                p={8}
                color={useColorModeValue('gray.700', 'whiteAlpha.900')}
                shadow="base"
                width={['100%', '100%', '50%', '50%']}
            >
                <form onSubmit={handleSubmit}>
                    <VStack spacing={5}>
                        <Heading>Match QR Code Data</Heading>
                        <FormControl isRequired>
                            <FormLabel>Regional</FormLabel>
                            <HStack>
                                <Icon as={ImEarth} />
                                <Select
                                    name="regional"
                                    onChange={(e) =>
                                        setRegional(e.target.value)
                                    }
                                >
                                    {regionals.map((regional) => (
                                        <option key={regional} value={regional}>
                                            {`${regional.toUpperCase()}`}
                                        </option>
                                    ))}
                                </Select>
                            </HStack>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Match Number</FormLabel>

                            <InputGroup>
                                <InputLeftElement
                                    children={<AiOutlineFieldNumber />}
                                />
                                <Input
                                    type="number"
                                    name="matchNum"
                                    placeholder="Match Number"
                                    onChange={(e) =>
                                        setMatchNum(e.target.value)
                                    }
                                />
                            </InputGroup>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Alliance</FormLabel>
                            <HStack>
                                <Icon as={BsFillShieldFill} />
                                <Select
                                    name="alliance"
                                    onChange={(e) =>
                                        setAlliance(e.target.value)
                                    }
                                >
                                    <option value="b">Blue</option>
                                    <option value="r">Red</option>
                                </Select>
                            </HStack>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Team Numbers</FormLabel>

                            <HStack>
                                <InputGroup>
                                    <InputLeftElement
                                        children={<AiOutlineFieldNumber />}
                                    />
                                    <Input
                                        type="number"
                                        name="team1"
                                        placeholder="Team 1"
                                        onChange={(e) =>
                                            setTeam1(e.target.value)
                                        }
                                    />
                                </InputGroup>
                                <InputGroup>
                                    <InputLeftElement
                                        children={<AiOutlineFieldNumber />}
                                    />
                                    <Input
                                        type="number"
                                        name="team2"
                                        placeholder="Team 2"
                                        onChange={(e) =>
                                            setTeam2(e.target.value)
                                        }
                                    />
                                </InputGroup>
                                <InputGroup>
                                    <InputLeftElement
                                        children={<AiOutlineFieldNumber />}
                                    />
                                    <Input
                                        type="number"
                                        name="team3"
                                        placeholder="Team 3"
                                        onChange={(e) =>
                                            setTeam3(e.target.value)
                                        }
                                    />
                                </InputGroup>
                            </HStack>
                        </FormControl>

                        <Button
                            colorScheme="blue"
                            bg="#4b0f6d"
                            color="white"
                            _hover={{
                                bg: '#2f064b',
                            }}
                            isFullWidth
                            type="submit"
                        >
                            Create QR Code
                        </Button>
                    </VStack>
                </form>
            </Box>
            {qrcode && (
                <Box
                    bg={'gray.100'}
                    borderRadius="lg"
                    p={8}
                    color={'gray.700'}
                    shadow="base"
                    width={'fit-content'}
                    marginTop={'3%'}
                >
                    <QRCode value={qrcode} />
                </Box>
            )}
        </div>
    );
};

export default QRCodeGenerator;
