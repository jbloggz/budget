/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * SourceLogo.tsx: This file contains the SourceLogo component
 */

import { Avatar, StyleProps } from '@chakra-ui/react';

interface SourceLogoProps {
   source: string;
}

const SourceLogo = (props: SourceLogoProps & StyleProps) => {
   const { source, ...styleProps } = props;
   return <Avatar src={'/' + source.replaceAll(' ', '') + '.png'} name={source} title={source} size={{ base: 'xs', md: 'sm' }} {...styleProps} />;
};

export default SourceLogo;
