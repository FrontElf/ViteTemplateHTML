<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

// ? Enqueue template assets (scripts and styles) ================================================

add_action( 'wp_enqueue_scripts', 'fe_template_assets', 10 );
function fe_template_assets() {
	wp_enqueue_style( 'fe-style-normalize', get_template_directory_uri() . '/style.css', array(), _S_VERSION, 'all' );
	wp_enqueue_style( 'fe-style', get_template_directory_uri() . '/assets/css/style.css', array(), _S_VERSION, 'all' );
	wp_enqueue_script( 'fe-scripts', get_template_directory_uri() . '/assets/js/app.js', array(), _S_VERSION, true );
}

// ? Add custom admin styles and scripts =========================================================

add_action( 'admin_enqueue_scripts', 'fe_admin_styles' );
function fe_admin_styles() {
	wp_enqueue_style( 'fe-admin-styles', get_template_directory_uri() . '/assets/css/admin-style.css', array(), _S_VERSION, 'all' );
}

// add_action( 'admin_enqueue_scripts', 'fe_enqueue_editor_styles' );
add_action( 'wp_enqueue_scripts', 'fe_enqueue_editor_styles', 10 );
add_action( 'enqueue_block_assets', 'fe_enqueue_editor_styles' );
add_action( 'enqueue_block_editor_assets', 'fe_enqueue_editor_styles' );
function fe_enqueue_editor_styles() {
	wp_enqueue_style( 'fe-style-normalize', get_template_directory_uri() . '/style.css', array(), _S_VERSION, 'all' );
	wp_enqueue_style( 'fe-style-editor', get_template_directory_uri() . '/assets/css/style.css', array(), _S_VERSION, 'all' );
}


// ? Add defer/async attribute to scripts =========================================================

add_filter( 'script_loader_tag', 'add_tag_attribute', 10, 2 );
function add_tag_attribute( $tag, $handle ) {
	$defer_scripts = [];
	$async_scripts = [];

	if ( in_array( $handle, $defer_scripts ) ) {
		return str_replace( ' src', ' defer src', $tag );
	}
	if ( in_array( $handle, $async_scripts ) ) {
		return str_replace( ' src', ' async src', $tag );
	}

	return $tag;
}
