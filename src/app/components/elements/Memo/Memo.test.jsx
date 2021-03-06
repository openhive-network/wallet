import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

import { Memo } from './index';

configure({ adapter: new Adapter() });

describe('Memo', () => {
    it('should return an empty span if no text is provided', () => {
        const wrapper = shallow(<Memo fromNegativeRepUser={false} />);
        expect(wrapper.html()).toEqual('<span></span>');
    });

    it('should render a plain ol memo', () => {
        const wrapper = shallow(
            <Memo fromNegativeRepUser={false} text="hi dude" />
        );
        expect(wrapper.html()).toEqual(
            '<div class="Memo"><div class="Memo__text">hi dude</div></div>'
        );
    });

    it('should deal with a memo from a user with bad reputation', () => {
        const wrapper = shallow(
            <Memo fromNegativeRepUser text="sorry charlie" />
        );

        expect(wrapper.html()).toEqual(
            // eslint-disable-next-line max-len
            '<div class="Memo Memo--fromNegativeRepUser"><div class="Memo__text"><div class="from-negative-rep-user-warning"><div class="from-negative-rep-user-caution">missing translation: en.transferhistoryrow_jsx.from_negative_rep_user_caution</div><div class="from-negative-rep-user-explained">missing translation: en.transferhistoryrow_jsx.from_negative_rep_user_explained</div><div tabindex="0" class="ptc from-negative-rep-user-reveal-memo" role="button">missing translation: en.transferhistoryrow_jsx.from_negative_rep_user_reveal_memo</div></div></div></div>'
        );

        wrapper
            .find('div.ptc')
            .simulate('click', { preventDefault: () => true });
        expect(wrapper.html()).toEqual(
            '<div class="Memo Memo--fromNegativeRepUser"><div class="Memo__text">sorry charlie</div></div>'
        );
    });
});
