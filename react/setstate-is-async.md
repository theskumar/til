# `setState` is Asynchronous

When beginning with React, I didn't initially realize that the `setState`
function is asynchronous.

If you call `setState` and then immediately refer to `this.state`, it's likely
that it won't be updated yet.

If you need to set the state and immediately act on that change, you can pass in
a callback function like this:

```js
this.setState({name: 'Jon'}, function() {
    // called after state has been updated
    // and the component has been re-rendered
});
```

Another option is to use the `componentWillUpdate` or `componentDidUpdate`
lifecycle methods. These methods are called immediately before and after
rendering due to a state change. They're also invoked when props change. If you
want to respond only to state changes, consider using the callback approach.

[source](https://daveceddia.com/react-gotchas/)
