import Navbar from '$lib/Navbar/Navbar.svelte';

export default {
	title: 'Components/Navbar',
	component: Navbar,
	argTypes: {
		user: {
			control: 'object',
			description:
				'User object. When null, the Navbar shows the Register button on the left and Log in link on the right.'
		}
	}
};

const Template = (args) => ({
	Component: Navbar,
	props: args
});

export const LoggedOut = Template.bind({});
LoggedOut.args = {
	user: null
};
