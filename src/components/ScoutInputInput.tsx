import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import {
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    Input,
    Select,
    VStack,
} from '@chakra-ui/react';
import React, { FC } from 'react';

interface ScoutInputInputProps {
    scoutInput: ScoutInputData;
    onChange: (scoutInput: ScoutInputData) => void;
    onDelete: () => void;
    disabled: boolean;
}

const ScoutInputInput: FC<ScoutInputInputProps> = ({
    scoutInput,
    onChange,
    onDelete,
    disabled,
}) => {
    return (
        <VStack>
            <HStack alignItems={'flex-end'}>
                <FormControl isDisabled={disabled}>
                    <FormLabel>Key</FormLabel>
                    <Input
                        type="text"
                        value={scoutInput.key}
                        onChange={(e) => {
                            const newScoutInput = {
                                ...scoutInput,
                                key: e.target.value,
                            };
                            onChange(newScoutInput);
                        }}
                    />
                </FormControl>
                <FormControl isDisabled={disabled}>
                    <FormLabel>Type</FormLabel>
                    <Select
                        value={scoutInput.type}
                        onChange={(e) => {
                            const newScoutInput = {
                                ...scoutInput,
                                type: e.target.value,
                            };
                            onChange(newScoutInput);
                        }}
                    >
                        <option value="counter">Counter</option>
                        <option value="timer">Timer</option>
                        <option value="text">Text</option>
                        <option value="boolean">Boolean</option>
                        <option value="dropdown">Dropdown</option>
                    </Select>
                </FormControl>

                <IconButton
                    disabled={disabled}
                    aria-label="delete"
                    icon={<DeleteIcon />}
                    colorScheme={'red'}
                    onClick={onDelete}
                />
            </HStack>
            {scoutInput.type === 'dropdown' && (
                <FormControl
                    isDisabled={disabled}
                    width={'80%'}
                    justifyContent={'center'}
                    display={'flex'}
                    flexDir={'column'}
                >
                    <FormLabel>Options</FormLabel>
                    {scoutInput.choices &&
                        scoutInput.choices.map((choice, index) => (
                            <HStack margin={1}>
                                <Input
                                    key={index}
                                    type="text"
                                    value={choice}
                                    onChange={(e) => {
                                        const newChoices = [
                                            ...(scoutInput.choices || []),
                                        ];
                                        newChoices[index] = e.target.value;
                                        onChange({
                                            ...scoutInput,
                                            choices: newChoices,
                                        });
                                    }}
                                />
                                <IconButton
                                    disabled={disabled}
                                    aria-label="delete"
                                    icon={<DeleteIcon />}
                                    colorScheme={'red'}
                                    onClick={() => {
                                        const newChoices = [
                                            ...(scoutInput.choices || []),
                                        ];
                                        newChoices.splice(index, 1);
                                        onChange({
                                            ...scoutInput,
                                            choices: newChoices,
                                        });
                                    }}
                                />
                            </HStack>
                        ))}
                    <IconButton
                        disabled={disabled}
                        aria-label="add"
                        icon={<AddIcon />}
                        onClick={() => {
                            const newChoices = [...(scoutInput.choices || [])];
                            newChoices.push('');
                            onChange({
                                ...scoutInput,
                                choices: newChoices,
                            });
                        }}
                        colorScheme={'green'}
                        variant={'outline'}
                    />
                </FormControl>
            )}
        </VStack>
    );
};

export default ScoutInputInput;
