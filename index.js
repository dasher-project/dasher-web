document.body.onload = () => {
    const ui = document.getElementById('user-interface');
    const textNode = document.createTextNode("Blibby");
    const element = document.createElement('div');
    element.appendChild(textNode);
    ui.appendChild(element);
}
