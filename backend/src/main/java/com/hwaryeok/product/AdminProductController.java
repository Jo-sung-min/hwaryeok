package com.hwaryeok.product;

import com.hwaryeok.ingredient.AdminProductIngredientRequest;
import com.hwaryeok.ingredient.AdminProductIngredientService;
import com.hwaryeok.ingredient.ProductIngredientsResponse;
import com.hwaryeok.user.ActiveUserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    private final ProductImageService productImageService;
    private final ProductService productService;
    private final ActiveUserService activeUserService;
    private final AdminProductIngredientService adminProductIngredientService;

    public AdminProductController(
            ProductImageService productImageService,
            ProductService productService,
            ActiveUserService activeUserService,
            AdminProductIngredientService adminProductIngredientService
    ) {
        this.productImageService = productImageService;
        this.productService = productService;
        this.activeUserService = activeUserService;
        this.adminProductIngredientService = adminProductIngredientService;
    }

    @GetMapping
    public List<ProductResponse> findAll(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return productService.findAllProducts();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AdminProductRequest request
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return productService.createProduct(request);
    }

    @PutMapping("/{productId}")
    public ProductResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @Valid @RequestBody AdminProductRequest request
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return productService.updateProduct(productId, request);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable String productId) {
        activeUserService.requireAdmin(jwt.getSubject());
        productService.deleteProduct(productId);
    }

    @PutMapping(path = "/{productId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductResponse uploadImage(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @RequestPart("file") MultipartFile file
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return productImageService.upload(productId, file);
    }

    @GetMapping("/{productId}/ingredients")
    public ProductIngredientsResponse findIngredients(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return adminProductIngredientService.find(productId);
    }

    @PutMapping("/{productId}/ingredients")
    public ProductIngredientsResponse replaceIngredients(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @Valid @RequestBody AdminProductIngredientRequest request
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return adminProductIngredientService.replace(productId, request);
    }
}
