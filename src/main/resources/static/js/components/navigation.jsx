import Description from 'material-ui-icons/Description';
import Settings from 'material-ui-icons/Settings';
import BottomNavigation, {BottomNavigationAction} from 'material-ui/BottomNavigation';
import {withRouter} from "react-router-dom";
import {withStyles} from 'material-ui/styles';
import MainLayoutWrapper from "./main-layout-wrapper.jsx";

const navigationNodes = {
    "receipts": "/",
    "settings": "/settings"
};

const styles = {
    navigationBar: {
        backgroundColor: '#CFD8DC'
    },

    navigationSlot: {
        position: 'fixed',
        bottom: 0,
        width: '100%',
    }
};


class Navigation extends React.Component {

    constructor(args) {
        super(args);
        this.classes = args.classes;
        this.state = {
            // navigationLocation: "receipts"
        }
    }

    render() {
        return (
            <MainLayoutWrapper className={this.classes.navigationSlot}>
                <BottomNavigation onChange={(e, v) => this.navigationChange(v)}
                                  showLabels className={this.classes.navigationBar}>
                    <BottomNavigationAction label="Receipts" value="receipts" icon={<Description/>}/>
                    <BottomNavigationAction label="Settings" value="settings" icon={<Settings/>}/>
                </BottomNavigation>
            </MainLayoutWrapper>
        )
    }

    navigationChange(location) {
        if (location !== this.state.navigationLocation) {
            this.setState({navigationLocation: location});
            this.props.history.push(navigationNodes[location]);
        }
    }
}

export default withRouter(withStyles(styles)(Navigation))