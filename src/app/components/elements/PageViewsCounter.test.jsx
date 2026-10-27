import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

import PageViewsCounter from './PageViewsCounter';

configure({ adapter: new Adapter() });

describe('PageViewsCounter', () => {
    it('mounts without throwing and renders nothing', () => {
        let wrapper;
        expect(() => {
            wrapper = mount(<PageViewsCounter />);
        }).not.toThrow();
        expect(wrapper.html()).toBeNull();
    });
});
