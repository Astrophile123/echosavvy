
window.onload = function() {
    fetch('http://localhost/ecommerce/api.php')
        .then(response => response.json())
        .then(data => {
            const productsContainer = document.getElementById('products');
            productsContainer.innerHTML = '';  

            data.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.classList.add('product');
                productDiv.innerHTML = `
                    <h2>${product.product_name}</h2>
                    <p>Category: ${product.product_category}</p>
                    <p>Product ID: ${product.product_id}</p>
                `;
                productsContainer.appendChild(productDiv);
            });
        })
        .catch(error => console.error('Error:', error));
};

function searchProducts() {
    const query = document.getElementById('searchBox').value.toLowerCase();
    const products = document.getElementsByClassName('product');

    Array.from(products).forEach(product => {
        const productName = product.querySelector('h2').textContent.toLowerCase();
        if (productName.includes(query)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

data.forEach(product => {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product');
    productDiv.innerHTML = `
        <h2><a href="product-detail.html?id=${product.product_id}">${product.product_name}</a></h2>
        <p>Category: ${product.product_category}</p>
        <p>Product ID: ${product.product_id}</p>
    `;
    productsContainer.appendChild(productDiv);
});
