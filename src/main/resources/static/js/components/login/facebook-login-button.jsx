import React from 'react';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';

export default class FbLoginButton extends React.Component {

    constructor(args) {
        super(args);
        this.state = {
            scriptReady: false

        }
    }

    render() {
        let medium = {
            width: 96,
            height: 96,
            padding: 24,
        };
        return (
            <form id="signInFacebook" action="/signin/facebook" method="POST" onSubmit={this.setCsrfToken}>
                <IconButton style={medium} type="submit" iconStyle={{fontSize:"48px"}}>
                    <FontIcon className="fa fa-facebook-square"/>
                </IconButton>
                <input type="hidden" name="_csrf"/>
            </form>
        );
    }

    setCsrfToken() {
        document.forms['signInFacebook']['_csrf'].value = Cookies.get("XSRF-TOKEN")
    }


}