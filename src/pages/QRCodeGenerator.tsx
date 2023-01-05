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
import {
    AiOutlineFieldNumber,
    AiOutlineArrowLeft,
    AiOutlineArrowRight,
} from 'react-icons/ai';
import { BsFillShieldFill } from 'react-icons/bs';
import React, { FC, SyntheticEvent, useEffect, useState } from 'react';
import { db } from '../firebase';
import QRCode from 'react-qr-code';

interface QRCodeGeneratorProps {}

interface MatchData {
    key: string;
    match_number: number;
}

const QRCodeGenerator: FC<QRCodeGeneratorProps> = () => {
    const year = new Date().getFullYear();
    const [regionals, setRegionals] = useState<string[]>([]); // hard code regionals in the case there is no internet
    const [qrcode, setQRCode] = useState<string>();
    const [regional, setRegional] = useState<string>('');
    const [alliance, setAlliance] = useState<string>('b');
    const [matchNum, setMatchNum] = useState<number>(1);
    const [team1, setTeam1] = useState<string | number>('');
    const [team2, setTeam2] = useState<string | number>('');
    const [team3, setTeam3] = useState<string | number>('');
    const [loaded, setLoaded] = useState<boolean>(false);
    const [loadedData, setLoadedData] = useState<any>({});

    useEffect(() => {
        const fetchData = async () => {
            const res = await db
                .collection('years')
                .doc(`${year}`)
                .collection('regionals')
                .get();
            setRegionals(res.docs.map((doc) => doc.id));
            if (res.docs.length > 0) setRegional(res.docs[0].id);
        };
        fetchData();
        let localData = localStorage.getItem('qrMatches');
        if (localData) {
            const temp = JSON.parse(localData);
            setLoadedData(temp.matches);
            setRegional(temp.regional);
            setLoaded(true);
        }
    }, [year]);

    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();

        console.log(regional);

        setQRCode(
            `${matchNum}@${regional}:${alliance}[${team1},${team2},${team3}]`,
        );
    };

    const loadRegionalData = async () => {
        const regionalKey = year + regional;
        const dataRes = await fetch(
            `https://www.thebluealliance.com/api/v3/event/${regionalKey}/matches/simple`,
            {
                headers: {
                    'X-TBA-Auth-Key': process.env.REACT_APP_TBA_KEY || '',
                },
            },
        );

        const dataJson = await dataRes.json();
        if (dataJson.length > 0) {
            console.log(dataJson);
            const filteredData = dataJson
                .filter((val: any) => val.comp_level == 'qm')
                .sort((a: any, b: any) => a.match_number - b.match_number);
            const temp: any = {};
            temp.matches = filteredData;
            temp.regional = regional;
            filteredData.length > 0 &&
                localStorage.setItem('qrMatches', JSON.stringify(temp));
            setLoadedData(filteredData);
            setLoaded(true);
        }
    };

    const fillData = () => {
        if (matchNum && loaded && loadedData && matchNum < loadedData.length) {
            const match = loadedData[matchNum - 1];
            let allianceData = null;
            if (alliance == 'b') {
                allianceData = match.alliances.blue.team_keys;
            } else if (alliance == 'r') {
                allianceData = match.alliances.red.team_keys;
            }
            const team1 = parseInt(allianceData[0].substring(3));
            const team2 = parseInt(allianceData[1].substring(3));
            const team3 = parseInt(allianceData[2].substring(3));
            setTeam1(team1);
            setTeam2(team2);
            setTeam3(team3);
            setQRCode(
                `${matchNum}@${regional}:${alliance}[${team1},${team2},${team3}]`,
            );
        }
    };

    useEffect(fillData, [loaded, alliance, matchNum]);

    const clearData = () => {
        localStorage.removeItem('qrMatches');
        setTeam1('');
        setTeam2('');
        setTeam3('');
        setQRCode('');
        setLoaded(false);
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
                display={'flex'}
                justifyContent={'space-between'}
                alignItems={'center'}
            >
                {matchNum > 0 && (
                    <Button
                        children={<AiOutlineArrowLeft />}
                        bg={'#FFFFFF'}
                        onClick={() => {
                            setMatchNum(matchNum - 1);
                        }}
                    />
                )}

                <form onSubmit={handleSubmit}>
                    <VStack spacing={5}>
                        <Heading textColor={'#550575'}>
                            Match QR Code Data
                        </Heading>
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
                                    value={matchNum}
                                    onChange={(e) =>
                                        setMatchNum(parseInt(e.target.value))
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
                                        value={team1}
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
                                        value={team2}
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
                                        value={team3}
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
                            onClick={() => {
                                loadRegionalData();
                            }}
                        >
                            Load Data
                        </Button>
                        {loaded && (
                            <Button
                                colorScheme="blue"
                                bg="#4b0f6d"
                                color="white"
                                _hover={{
                                    bg: '#2f064b',
                                }}
                                isFullWidth
                                onClick={clearData}
                            >
                                Clear Data
                            </Button>
                        )}
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

                {matchNum < loadedData.length - 1 && (
                    <Button
                        children={<AiOutlineArrowRight />}
                        bg={'#FFFFFF'}
                        onClick={() => {
                            setMatchNum(matchNum + 1);
                        }}
                    />
                )}
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
