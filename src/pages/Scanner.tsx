import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Heading,
    IconButton,
    Spacer,
    Table,
    Tbody,
    Td,
    Tr,
    VStack,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NeedAccount from './NeedAccount';
import QRScan from 'qrscan';
import { DeleteIcon } from '@chakra-ui/icons';
import { db } from '../firebase';

interface ScannerProps {}

const Scanner: FC<ScannerProps> = () => {
    const [qrVisible, setQrVisible] = useState<boolean>(false);
    const [data, setData] = useState<any[]>([]);
    const { currentUser } = useAuth();
    const year = 2019; //new Date().getFullYear();

    useEffect(() => {
        setData(JSON.parse(localStorage.getItem('matches') || '[]'));
    }, []);

    const uploadData = () => {
        data.forEach(async (match) => {
            const teamDoc = await db
                .collection('years')
                .doc(year + '')
                .collection('regionals')
                .doc(match.regional)
                .collection('teams')
                .doc(match.teamNum)
                .get();
            if (!teamDoc.exists) await teamDoc.ref.set({});
            db.collection('years')
                .doc(year + '')
                .collection('regionals')
                .doc(match.regional)
                .collection('teams')
                .doc(match.teamNum)
                .collection('matches')
                .doc(match.matchNum)
                .set(match);
            setData([]);
            localStorage.setItem('matches', '[]');
        });
    };

    if (!currentUser) return <NeedAccount />;
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
                bg={'white'}
                borderRadius="lg"
                p={8}
                color={'gray.700'}
                shadow="base"
                width={'fit-content'}
                marginTop={'3%'}
            >
                {qrVisible ? (
                    <QRScan
                        onFind={(val: any) => {
                            const matchData = JSON.parse(val);
                            setQrVisible(false);
                            setData([...data, matchData]);
                            localStorage.setItem(
                                'matches',
                                JSON.stringify([...data, matchData]),
                            );
                        }}
                    />
                ) : (
                    <Button
                        onClick={() => setQrVisible(true)}
                        colorScheme="mv-purple"
                    >
                        Scan Data
                    </Button>
                )}
            </Box>

            <VStack width="25%" marginTop={'3%'}>
                <Heading>Locally Stored Matches</Heading>
                <Spacer />
                <Button
                    colorScheme="green"
                    onClick={uploadData}
                    disabled={!data.length}
                >
                    Upload Matches
                </Button>
                <Spacer />
                <Accordion allowMultiple width="100%">
                    {data.map((match, index) => (
                        <AccordionItem key={index}>
                            <h2>
                                <AccordionButton>
                                    <Box flex="1" textAlign="left">
                                        Match # {match.matchNum} Team #{' '}
                                        {match.teamNum}{' '}
                                    </Box>

                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel>
                                <IconButton
                                    aria-label="delete-data"
                                    icon={<DeleteIcon />}
                                    colorScheme={'red'}
                                    onClick={() => {
                                        const newData = [...data];
                                        newData.splice(index, 1);
                                        localStorage.setItem(
                                            'matches',
                                            JSON.stringify(newData),
                                        );
                                        setData(newData);
                                    }}
                                    isFullWidth
                                />
                                <Table>
                                    <Tbody>
                                        {Object.keys(match).map((key) => (
                                            <Tr key={key}>
                                                <Td>{key}</Td>
                                                <Td>{match[key] + ''}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </AccordionPanel>
                        </AccordionItem>
                    ))}
                </Accordion>
            </VStack>
        </div>
    );
};

export default Scanner;
