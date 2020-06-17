import React, { Component, useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native'
import { FlatList, View, Text, TouchableOpacity, AsyncStorage, StatusBar, BackHandler, ActivityIndicator } from 'react-native';
import { Feather, Ionicons, FontAwesome } from '@expo/vector-icons'
import { Icon, Button } from 'native-base'

import api from '../../services/api'

import logoImg from '../../assets/logo.png'
import styles from './styles'
import * as Animatable from 'react-native-animatable'
import { SearchBar } from 'react-native-elements'

import { showError, showSucess } from '../../common'

export default function Home() {
    const navigation = useNavigation()
    const [posts, setPosts] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    function navigateToNewPost() {
        navigation.navigate('NewPost')
    }
    function navigateToContent() {
        navigation.navigate('HomeContent')
    }
    function navigateToPost(post) {
        navigation.navigate('PostPage', {
            post
        })
    }
    renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loading}>
                <ActivityIndicator />
            </View>
        );
    };
    useEffect(() => {
        loadPosts()
    }, [])

    async function handleLike(postId) {
        const user_id = await AsyncStorage.getItem('user')//Fazer esse puto entrar no estado
        try {
            const response = await api.post(`/posts/${postId}/like`, {
            }, {
                headers: { user_id }
            })
            reloadPosts()
        } catch (e) {
            showError(e)
        }
    }
    async function loadPosts() {
        setRefreshing(false)
        const user_id = await AsyncStorage.getItem('user')//Fazer esse puto entrar no estado
        if (loading) {//Impede que uma busca aconteça enquanto uma requisição já foi feita
            return
        }
        const getTotal = await api.head('/posts', { headers: { user_id } })
        setTotal(getTotal.headers['x-total-count'])
        if (total > 0 && posts.length == total) {//Impede que faça a requisição caso a qtd máxima já tenha sido atingida
            console.log(total + "-" + posts.length)
            return
        }

        setLoading(true)//Altera para o loading iniciado
        try {
            const response = await api.get('/posts', {
                headers: { user_id },
                params: { page }
            })
            //setPosts(response.data)
            setPosts([...posts, ...response.data])
            //setTotal(response.headers['x-total-count'])
            if (response.data.length > 0) {
                setPage(page + 1)
            }
        } catch (e) {
            showError(e)
        }
        setLoading(false)//Conclui o load
    }
    const reloadPosts = useCallback(() => {
        setIsSearching(false)
        setRefreshing(true)
        setPage(1)
        setPosts([])
        loadPosts()
    })

    const onLoadMore = useCallback(() => {
        if (isSearching == true) {

        } else {
            loadPosts()
        }
    })

    async function onSearchPress() {
        if (searchText.trim() == '') {
            reloadPosts()
        }
        else {
            if (loading) {//Impede que uma busca aconteça enquanto uma requisição já foi feita
                return
            }
            setIsSearching(true)
            //setTotal(getTotal.headers['x-total-count'])
            // if (total > 0 && posts.length == total) {//Impede que faça a requisição caso a qtd máxima já tenha sido atingida
            //     console.log(total + "-" + posts.length)
            //     return
            // }

            setLoading(true)//Altera para o loading iniciado
            try {
                const response = await api.post('/posts/search', {
                    searchText
                })
                setPosts(response.data)
                //setPosts([...posts, ...response.data])
                //setTotal(response.headers['x-total-count'])
                if (response.data.length > 0) {
                    //    setPage(page + 1)
                }
            } catch (e) {
                showError(e)
            }
            setLoading(false)//Conclui o load
        }
    }

    return (
        //reidner 26/04
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent={false} backgroundColor={'#365478'} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.openDrawer()}>
                    <Feather name="menu" size={20} color="#FFC300"></Feather>
                </TouchableOpacity>
                <Text style={{ fontWeight: 'bold', color: "white", fontSize: 25 }}>Dúvidas</Text>
                <TouchableOpacity style={styles.detailsButton} onPress={onSearchPress}>
                    <Feather name="filter" size={20} color="#FFC300"></Feather>
                </TouchableOpacity>
            </View>

            <View style={styles.Search}>
                <SearchBar
                    onChangeText={setSearchText}
                    value={searchText}
                    on
                    round
                    platform="ios"
                    cancelButtonTitle="Cancelar"
                    placeholder='Pesquise o assunto de interesse...'
                    containerStyle={styles.Barheight}
                    inputStyle={{ fontSize: 15 }}
                />
            </View>

            <View style={styles.Body}>
                <View style={styles.BodyFlat}>
                    <Text>{loading}</Text>
                    <FlatList
                        data={posts}
                        style={styles.postsList}
                        keyExtractor={post => String(post._id)}
                        refreshing={refreshing}
                        onRefresh={reloadPosts}
                        // onTouchStart={reloadPosts}
                        onEndReached={onLoadMore}
                        onEndReachedThreshold={0.2}
                        ListFooterComponent={renderFooter}
                        showsVerticalScrollIndicator={true}//OBS:Trocar para false ao finalizar testes!!!!
                        renderItem={({ item: post }) => (
                            <Animatable.View
                                style={styles.post}
                                animation="fadeInDown"
                                duration={1000}>
                                <View style={styles.postHeader}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={styles.postTitulo}>
                                            <Feather name="camera" size={30} color='#D8D9DB'></Feather>
                                            <Text style={styles.postTitle}>{post.title}</Text>
                                        </View>
                                        <Text style={styles.Nomepost}>{post.user.name}</Text>
                                    </View>
                                    <View style={styles.headerTags}>
                                        <Text style={styles.postTag}>{post.tags.toString()}</Text>
                                        <TouchableOpacity style={styles.Ver} onPress={() => navigateToPost(post)}>
                                            <Feather name="chevron-right" size={25} color='#FFC300'></Feather>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.postDesc}>
                                    <Text style={styles.postDescricao}>{post.desc}</Text>
                                </View>
                                <View style={{ paddingHorizontal: 25, paddingBottom: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => handleLike(post._id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <FontAwesome name={post.didILiked == false ? "heart-o" : "heart"} style={{ color: 'red', fontSize: 12 }} />
                                            <Text style={{ marginLeft: 3, fontSize: 12, color: 'gray' }}>{post.likes.length}</Text>
                                        </TouchableOpacity>
                                        <FontAwesome name="commenting-o" style={{ color: '#D8D9DB', fontSize: 12, marginLeft: 15 }} />
                                        <Text style={{ marginLeft: 3, fontSize: 12, color: 'gray' }}>{post.commentsCount }</Text>
                                    </View>
                                    {post.closed ? <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 13, color: '#117A65', fontWeight: '800' }}>Dúvida finalizada</Text>
                                        <Feather name="check-circle" size={15} color='#117A65' style={{ marginLeft: 5 }}></Feather>
                                    </View> : null}

                                </View>
                            </Animatable.View>
                        )}>
                    </FlatList>
                </View>

                <Animatable.View
                    style={styles.footer}
                    animation="fadeInUp"
                    duration={900}>
                    <TouchableOpacity style={styles.detailsBar} onPress={() => reloadPosts()}>
                        <Text style={styles.detailsButtonTextHome}>Dúvidas</Text>
                        <Feather name="edit-3" size={16} color="#FFC300"></Feather>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.detailsBar} onPress={() => navigateToContent()}>
                        <Text style={styles.detailsButtonText}>Conteúdos</Text>
                        <Feather name="book-open" size={16} color="white"></Feather>
                    </TouchableOpacity>
                </Animatable.View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={() => navigateToNewPost()}>
                <Animatable.View
                    animation="fadeIn">
                    <Feather name="plus" size={25} color="white"></Feather>
                </Animatable.View>
            </TouchableOpacity>
        </View>
    );
}
