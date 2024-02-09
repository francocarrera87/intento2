const express = require('express');
const fs = require('fs/promises');
const app = express();
app.use(express.json());

const productsFilePath = 'productos.json';
const cartsFilePath = 'carritos.json';

async function ensureFilesExist() {
    try {
        await fs.access(productsFilePath);
    } catch (error) {
        await fs.writeFile(productsFilePath, '[]', 'utf-8');
    }

    try {
        await fs.access(cartsFilePath);
    } catch (error) {
        await fs.writeFile(cartsFilePath, '[]', 'utf-8');
    }
}

ensureFilesExist().then(() => {
    // Rutas para productos
    app.get('/api/products', async (req, res) => {
        try {
            const productsData = await fs.readFile(productsFilePath, 'utf-8');
            const products = JSON.parse(productsData);
            res.json(products);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al leer productos desde el archivo');
        }
    });

    app.get('/api/products/:pid', async (req, res) => {
        try {
            const productsData = await fs.readFile(productsFilePath, 'utf-8');
            const products = JSON.parse(productsData);
            const product = products.find(p => p.id === req.params.pid);
            res.json(product);
        } catch (error) {
            res.status(500).send('Error al leer productos desde el archivo');
        }
    });

    app.post('/api/products', async (req, res) => {
        try {
            const productsData = await fs.readFile(productsFilePath, 'utf-8');
            const products = JSON.parse(productsData);

            const { title, description, code, price, status, stock, category, thumbnails } = req.body;

            if (!title || !description || !code || !price || status === undefined || !stock || !category || !thumbnails) {
                return res.status(400).send('Todos los campos son obligatorios, excepto thumbnails');
            }

            const product = { id: Date.now().toString(), title, description, code, price, status, stock, category, thumbnails };
            products.push(product);

            await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');

            res.json(product);
        } catch (error) {
            res.status(500).send('Error al escribir productos en el archivo');
        }
    });

    app.put('/api/products/:pid', async (req, res) => {
        try {
            const productsData = await fs.readFile(productsFilePath, 'utf-8');
            const products = JSON.parse(productsData);
    
            const index = products.findIndex(p => p.id === req.params.pid);
            if (index !== -1) {
                const updatedFields = req.body;
                // Actualizar solo los campos especificados en el cuerpo de la solicitud
                products[index] = { ...products[index], ...updatedFields };
    
                await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
                res.json(products[index]);
            } else {
                res.status(404).send('Producto no encontrado');
            }
        } catch (error) {
            res.status(500).send('Error al escribir productos en el archivo');
        }
    });
    

    app.delete('/api/products/:pid', async (req, res) => {
        try {
            const productsData = await fs.readFile(productsFilePath, 'utf-8');
            const products = JSON.parse(productsData);

            const index = products.findIndex(p => p.id === req.params.pid);
            if (index !== -1) {
                const deletedProduct = products.splice(index, 1);
                await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
                res.json(deletedProduct);
            } else {
                res.status(404).send('Producto no encontrado');
            }
        } catch (error) {
            res.status(500).send('Error al escribir productos en el archivo');
        }
    });

    // Rutas para carritos
    app.post('/api/carts', async (req, res) => {
        try {
            const cartsData = await fs.readFile(cartsFilePath, 'utf-8');
            const carts = JSON.parse(cartsData);

            const cart = { id: Date.now().toString(), products: [] };
            carts.push(cart);

            await fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), 'utf-8');

            res.json(cart);
        } catch (error) {
            console.error('Error al escribir carritos en el archivo:', error);
            res.status(500).send('Error al escribir carritos en el archivo');
        }
    });

    app.get('/api/carts/:cid', async (req, res) => {
        try {
            const cartsData = await fs.readFile(cartsFilePath, 'utf-8');
            const carts = JSON.parse(cartsData);

            const cart = carts.find(c => c.id === req.params.cid);
            res.json(cart);
        } catch (error) {
            res.status(500).send('Error al leer carritos desde el archivo');
        }
    });

    app.post('/api/carts/:cid/products/:pid', async (req, res) => {
        try {
            const cartsData = await fs.readFile(cartsFilePath, 'utf-8');
            const carts = JSON.parse(cartsData);

            const productsData = await fs.readFile(productsFilePath, 'utf-8');
            const products = JSON.parse(productsData);

            const cart = carts.find(c => c.id === req.params.cid);
            const product = products.find(p => p.id === req.params.pid);

            if (!cart || !product) {
                return res.status(404).send('Carrito o producto no encontrado');
            }

            const cartProduct = cart.products.find(cp => cp.product === product.id);
            if (cartProduct) {
                cartProduct.quantity += 1;
            } else {
                cart.products.push({ product: product.id, quantity: 1 });
            }

            await fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), 'utf-8');

            res.json(cart);
        } catch (error) {
            res.status(500).send('Error al escribir carritos en el archivo');
        }
    });

    // Ruta DELETE para eliminar un carrito específico
    app.delete('/api/carts/:cid', async (req, res) => {
        try {
            const cartsData = await fs.readFile(cartsFilePath, 'utf-8');
            const carts = JSON.parse(cartsData);
            const index = carts.findIndex(c => c.id === req.params.cid);
            if (index !== -1) {
                const deletedCart = carts.splice(index, 1);
                await fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), 'utf-8');
                res.json(deletedCart);
            } else {
                res.status(404).send('Carrito no encontrado');
            }
        } catch (error) {
            res.status(500).send('Error al escribir carritos en el archivo');
        }
    });

    app.listen(8080, () => console.log('Servidor escuchando en el puerto 8080'));
});
