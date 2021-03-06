import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, boolean } from '@storybook/addon-knobs';
import HiveLogo from './index';
import { Center } from 'decorators';

storiesOf('Elements', module)
    .addDecorator(withKnobs)
    .addDecorator(Center)
    .add('HiveLogo', () => <HiveLogo />);
