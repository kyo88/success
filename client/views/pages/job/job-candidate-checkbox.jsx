JobCandidateCheckBox = React.createClass({
    getInitialState() {
        return {};
    },
    componentDidMount() {
        let selectEl = ReactDOM.findDOMNode(this.refs.checkbox);
        $(selectEl).iCheck({
            checkboxClass: 'icheckbox_square-green'
        });

        let appId = this.props.applicationId || null;
        $(selectEl).on('ifChecked', () => {
            this.props.onCheck && this.props.onCheck(appId);
        });

        $(selectEl).on('ifUnchecked', () => {
            this.props.onUncheck && this.props.onUncheck(appId);
        });

        if (this.props.checked) {
            $(selectEl).iCheck('check');
        }
    },

    componentWillUpdate(nextProps, nextState) {
        if (this.props.checked != nextProps.checked) {
            let selectEl = ReactDOM.findDOMNode(this.refs.checkbox);
            if (nextProps.checked) {
                $(selectEl).iCheck('check');
            } else {
                $(selectEl).iCheck('uncheck');
            }
        }
    },

    render() {
        return (
            <input type="checkbox" ref="checkbox"/>
        );
    }
});