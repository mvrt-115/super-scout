import {
    Stack,
    Flex,
    Text,
    Icon,
    Box,
    SimpleGrid,
    Heading,
    Button,
    useBreakpointValue,
    VStack,
} from '@chakra-ui/react';
import React, { FC, ReactElement } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
    FcComboChart,
    FcCamcorderPro,
    FcPrint,
    FcTodoList,
    FcCheckmark,
} from 'react-icons/fc';
import '@fontsource/montserrat/500.css';
import ScoutHome from '../assets/scouthome.jpg';
import Navbar from '../components/Navbar';

interface HomeProps {}

const Home: FC<HomeProps> = () => {
    const history = useHistory();
    return (
        <Box>
            <Flex
                w={'full'}
                h={'100vh'}
                backgroundImage={ScoutHome}
                backgroundSize={'cover'}
                backgroundPosition={'center center'}
            >
                <Box
                    w={'full'}
                    px={useBreakpointValue({ base: 4, md: 8 })}
                    bgGradient={'linear(to-r, blackAlpha.600, transparent)'}
                >
                    <Navbar />
                    <VStack justify="center" height={'calc(100vh - 64px)'}>
                        <Stack maxW={'2xl'} align={'flex-start'} spacing={6}>
                            <Text
                                color={'white'}
                                fontWeight={700}
                                lineHeight={1.2}
                                fontSize={useBreakpointValue({
                                    base: '3xl',
                                    md: '4xl',
                                })}
                            >
                                Scouting at{' '}
                                <Text
                                    color="purple.500"
                                    as="span"
                                    fontSize={'4.5rem'}
                                >
                                    MVRT
                                </Text>{' '}
                                starts here
                            </Text>
                            <Stack direction={'row'}>
                                <Button
                                    colorScheme={'purple'}
                                    rounded={'full'}
                                    color={'white'}
                                >
                                    Dashboard
                                </Button>
                                <Button
                                    bg={'whiteAlpha.300'}
                                    rounded={'full'}
                                    color={'white'}
                                    _hover={{ bg: 'whiteAlpha.500' }}
                                >
                                    Scanner
                                </Button>
                            </Stack>
                        </Stack>
                    </VStack>
                </Box>
            </Flex>
        </Box>
    );
};

//     return (
//         <div
//             style={{
//                 width: '100%',
//                 display: 'flex',
//                 justifyContent: 'center',
//                 alignItems: 'center',
//                 alignSelf: 'center',
//                 justifySelf: 'center',
//             }}
//         >
//             <div
//                 style={{
//                     display: 'flex',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                     flexDirection: 'column',
//                     marginTop: '1rem'
//                 }}
//             >
//                 <Heading
//                     fontWeight={600}
//                     fontSize={{ base: '2xl', sm: '4xl', md: '6xl' }}
//                     lineHeight={'110%'}
//                     color={'mv-purple.500'}
//                     style={{
//                         display: 'flex',
//                         padding: '1rem',
//                     }}
//                 >
//                     <Text>
//                         MVRT
//                     </Text>
//                     <Text as={'span'} color={'mv-purple.1000'} style={{ fontFamily: 'Montserrat' }}>
//                         Super Scout
//                     </Text>
//                 </Heading>
//                 <Box p={6} display="flex" justifyContent={'center'} marginTop={'0.5rem'}>
//                     <SimpleGrid
//                         columns={{ base: 2, md: 3 }}
//                         spacing={10}
//                         width={['100%', '100%', '60%']}
//                     >
//                         <Feature
//                             icon={<Icon w={10} h={10} as={FcComboChart} />}
//                             title="Dashboard"
//                             text="View scouting data to evaluate team performances at regionals and compare different teams"
//                             to="/dashboard"
//                         />
//                         <Feature
//                             icon={<Icon w={10} h={10} as={FcCamcorderPro} />}
//                             title="Scanner"
//                             text="Upload scouting data to database from a QR codes generated by scouting app"
//                             to="/scanner"
//                         />
//                         <Feature
//                             icon={<Icon w={10} h={10} as={FcPrint} />}
//                             title="Match QR Code"
//                             text="Generate QR codes that can be scanned by scouting app to start scouting a given match"
//                             to="/qr-code-generator"
//                         />
//                         <Feature
//                             icon={<Icon w={10} h={10} as={FcTodoList} />}
//                             title="Scouting Inputs"
//                             text="View and edit scouting inputs for the current years FRC game that will be used by the scouting app"
//                             to="/scouting-inputs"
//                         />
//                         <Feature
//                             icon={<Icon w={10} h={10} as={FcCheckmark} />}
//                             title="Picklist"
//                             text="Add and remove teams for a Picklist in the desired regional"
//                             to="/picklist"
//                         />
//                     </SimpleGrid>
//                 </Box>
//             </div>
//         </div>
//     );
// };

// interface FeatureProps {
//     title: string;
//     text: string;
//     icon: ReactElement;
//     to: string;
// }

// const Feature: FC<FeatureProps> = ({ title, text, icon, to }) => {
//     return (
//         <Stack
//             as={Link}
//             to={to}
//             justifyContent={'center'}
//             alignItems={'center'}
//         >
//             <Flex
//                 w={16}
//                 h={16}
//                 align={'center'}
//                 justify={'center'}
//                 color={'white'}
//                 rounded={'full'}
//                 bg={'gray.100'}
//                 mb={1}
//             >
//                 {icon}
//             </Flex>
//             <Text color={"mv-purple.500"} fontWeight={600}>{title}</Text>
//             <Text color={'mv-purple.500'} textAlign={'center'}>
//                 {text}
//             </Text>
//         </Stack>
//     );
// };

export default Home;
